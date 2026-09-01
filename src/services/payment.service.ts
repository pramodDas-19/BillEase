import { supabase } from "@/lib/supabase/client";
import { Payment } from "@/types";
import { AuthService } from "./auth.service";

export const PaymentService = {
  // Fetch all payment receipts for active tenant from Supabase
  async getPayments(): Promise<Payment[]> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch payments error:", error.message);
        return [];
      }

      if (!data) return [];

      return data.map((p) => ({
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
    } catch (err) {
      console.error("PaymentService.getPayments error:", err);
      return [];
    }
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

      // 1. Insert payment record
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

      const { error: payError } = await supabase.from("payments").insert([payload]);
      if (payError) {
        console.error("Supabase insert payment error:", payError);
        return null;
      }

      // 2. If attached to an invoice, auto-update invoice paid_amount & balance_due
      if (payment.invoiceId) {
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
      }

      return {
        ...payment,
        id: paymentId,
        paymentNumber,
        tenantId: tenantId,
      } as Payment;
    } catch (err) {
      console.error("PaymentService.recordPayment error:", err);
      return null;
    }
  },

  // Delete a payment receipt
  async deletePayment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete payment error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("PaymentService.deletePayment error:", err);
      return false;
    }
  },
};
