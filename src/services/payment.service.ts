import { supabase } from "@/lib/supabase/client";
import { Payment } from "@/types";
import { AuthService } from "./auth.service";

const getLocalPayments = (): Payment[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("billease_payments");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalPayments = (payments: Payment[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("billease_payments", JSON.stringify(payments));
  } catch {}
};

export const PaymentService = {
  // Fetch all payment receipts for active tenant from Supabase & localStorage fallback
  async getPayments(): Promise<Payment[]> {
    let remotePayments: Payment[] = [];
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        remotePayments = data.map((p) => ({
          id: p.id,
          tenantId: p.tenant_id,
          paymentNumber: p.payment_number,
          invoiceId: p.invoice_id,
          invoiceNumber: p.invoice_number,
          clientId: p.client_id,
          clientName: p.client_name,
          amount: parseFloat(p.amount || "0"),
          currency: p.currency || "INR",
          paymentDate: p.payment_date,
          paymentMethod: p.payment_method,
          transactionReference: p.transaction_reference,
          notes: p.notes,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
      } else if (error) {
        console.warn("Supabase fetch payments warning:", error.message);
      }
    } catch (err) {
      console.warn("PaymentService.getPayments caught:", err);
    }

    const localPayments = getLocalPayments();
    if (remotePayments.length > 0) {
      const map = new Map<string, Payment>();
      remotePayments.forEach((p) => map.set(p.id, p));
      localPayments.forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return localPayments;
  },

  // Create payment alias
  async createPayment(payment: Partial<Payment>): Promise<Payment | null> {
    return this.recordPayment(payment);
  },

  // Record a new payment in Supabase and update invoice balance
  async recordPayment(payment: Partial<Payment>): Promise<Payment | null> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const paymentId = payment.id || `pay-${Date.now()}`;
      const paymentNumber = payment.paymentNumber || `PAY-${Date.now().toString().slice(-4)}`;

      const newPayment: Payment = {
        id: paymentId,
        tenantId: tenantId,
        paymentNumber: paymentNumber,
        invoiceId: payment.invoiceId || "",
        invoiceNumber: payment.invoiceNumber || "",
        clientId: payment.clientId || "",
        clientName: payment.clientName || "Client",
        amount: payment.amount || 0,
        currency: payment.currency || "INR",
        paymentDate: payment.paymentDate || new Date().toISOString().split("T")[0],
        paymentMethod: payment.paymentMethod || "upi",
        transactionReference: payment.transactionReference || undefined,
        notes: payment.notes || undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Always persist to localStorage for instant client responsiveness
      const existingLocal = getLocalPayments();
      saveLocalPayments([newPayment, ...existingLocal.filter((p) => p.id !== paymentId)]);

      // 1. Insert payment record in Supabase
      const payload = {
        id: paymentId,
        tenant_id: tenantId,
        payment_number: paymentNumber,
        invoice_id: payment.invoiceId || null,
        invoice_number: payment.invoiceNumber || null,
        client_id: payment.clientId || null,
        client_name: payment.clientName,
        amount: payment.amount || 0,
        currency: payment.currency || "INR",
        payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
        payment_method: payment.paymentMethod || "upi",
        transaction_reference: payment.transactionReference || null,
        notes: payment.notes || null,
        status: "completed",
      };

      try {
        await supabase.from("payments").insert([payload]);
      } catch (e) {
        console.warn("Supabase payments insert warning:", e);
      }

      // 2. If attached to an invoice, auto-update invoice paid_amount & balance_due
      if (payment.invoiceId) {
        try {
          const { data: invData } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", payment.invoiceId)
            .single();

          if (invData) {
            const currentPaid = parseFloat(invData.paid_amount || "0");
            const totalAmt = parseFloat(invData.total_amount || "0");
            const newPaid = currentPaid + (payment.amount || 0);
            const newBalance = Math.max(0, totalAmt - newPaid);
            const newStatus = newBalance <= 0 ? "paid" : "partially_paid";

            await supabase
              .from("invoices")
              .update({
                paid_amount: newPaid,
                balance_due: newBalance,
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", payment.invoiceId);
          }
        } catch (e) {
          console.warn("Supabase invoice settlement sync warning:", e);
        }
      }

      // 3. Dispatch Notification
      try {
        const { NotificationService } = await import("./notification.service");
        NotificationService.notifyAction({
          type: "payment_received",
          title: `Payment Received (${payment.currency || "₹"}${payment.amount || 0})`,
          message: `Receipt #${paymentNumber} recorded for ${payment.clientName} via ${(payment.paymentMethod || "upi").toUpperCase()}.`,
          actionUrl: "/payments",
          clientName: payment.clientName,
          amount: payment.amount,
        });
      } catch {}

      return newPayment;
    } catch (err) {
      console.error("PaymentService.recordPayment error:", err);
      return null;
    }
  },

  // Delete a payment receipt
  async deletePayment(id: string): Promise<boolean> {
    try {
      const existingLocal = getLocalPayments();
      saveLocalPayments(existingLocal.filter((p) => p.id !== id));

      await supabase.from("payments").delete().eq("id", id);
      return true;
    } catch (err) {
      console.error("PaymentService.deletePayment error:", err);
      return false;
    }
  },
};
