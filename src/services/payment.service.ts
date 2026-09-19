import { supabase } from "@/lib/supabase/client";
import { Payment } from "@/types";
import { AuthService } from "./auth.service";
import { isNetworkError } from "@/lib/network-detector";
import { enqueueMutation, getPendingMutations } from "@/lib/offline-queue";

const getLocalPayments = (tenantId?: string): Payment[] => {
  if (typeof window === "undefined") return [];
  const targetTenantId = tenantId || "tenant-royal-events";
  try {
    // 1. Primary: Read tenant-specific payment cache
    const scopedRaw = localStorage.getItem(`billease_payments_${targetTenantId}`);
    if (scopedRaw) {
      const parsed = JSON.parse(scopedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((p) => p.tenantId === targetTenantId);
      }
    }

    // 2. Legacy check: If un-scoped key exists, gracefully migrate to tenant buckets without dropping data
    const legacyRaw = localStorage.getItem("billease_payments");
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const p of parsed) {
          const tid = p.tenantId || "tenant-royal-events";
          const existing = localStorage.getItem(`billease_payments_${tid}`);
          const list: Payment[] = existing ? JSON.parse(existing) : [];
          if (!list.some((item) => item.id === p.id)) {
            list.push({ ...p, tenantId: tid });
            localStorage.setItem(`billease_payments_${tid}`, JSON.stringify(list));
          }
        }
        return parsed.filter((p) => (p.tenantId || "tenant-royal-events") === targetTenantId);
      }
    }
    return [];
  } catch {
    return [];
  }
};

const saveLocalPayments = (tenantId: string, payments: Payment[]) => {
  if (typeof window === "undefined" || !tenantId) return;
  try {
    const strictlyTenant = payments.filter((p) => p.tenantId === tenantId);
    localStorage.setItem(`billease_payments_${tenantId}`, JSON.stringify(strictlyTenant));
  } catch {}
};

export const PaymentService = {
  // Fetch all payment receipts for active tenant from Supabase & localStorage fallback
  async getPayments(): Promise<Payment[]> {
    let remotePayments: Payment[] = [];
    const isImpersonating =
      typeof window !== "undefined" &&
      (sessionStorage.getItem("billease_is_impersonating") === "true" ||
        localStorage.getItem("billease_is_impersonating") === "true");

    let tenantId = "";
    try {
      tenantId = await AuthService.getActiveTenantId();

      if (isImpersonating) {
        try {
          const res = await fetch(`/api/admin/impersonate?tenantId=${tenantId}&type=payments`);
          if (res.ok) {
            const json = await res.json();
            const list = json.payments || [];
            return list
              .filter((p: any) => !tenantId || p.tenant_id === tenantId)
              .map((p: any) => ({
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
          }
        } catch (e) {
          console.warn("Could not fetch impersonated payments via admin API:", e);
        }
        return [];
      }

      if (tenantId) {
        const queryPromise = supabase
          .from("payments")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        const res: any = await Promise.race([
          queryPromise,
          new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 2000)),
        ]);
        const data = res?.data;
        const error = res?.error;

        if (!error && data) {
          remotePayments = (data as any[])
            .filter((p: any) => p.tenant_id === tenantId)
            .map((p: any) => ({
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
        } else if (error && error.message !== "timeout") {
          console.warn("Supabase fetch payments warning:", error.message);
        }
      }
    } catch (err) {
      console.warn("PaymentService.getPayments caught:", err);
    }

    if (isImpersonating) {
      return remotePayments;
    }

    // Tenant-isolated local cache
    const localPayments = getLocalPayments(tenantId);
    let resultList: Payment[] = [];
    if (remotePayments.length > 0) {
      const map = new Map<string, Payment>();
      remotePayments.forEach((p) => {
        if (!tenantId || p.tenantId === tenantId) map.set(p.id, p);
      });
      localPayments.forEach((p) => {
        if ((!tenantId || p.tenantId === tenantId) && !map.has(p.id)) {
          map.set(p.id, p);
        }
      });
      resultList = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // If remote has 0 payments (new tenant profile), return only payments strictly belonging to tenantId
      resultList = tenantId
        ? localPayments.filter((p) => p.tenantId === tenantId)
        : [];
    }

    // Merge pending offline payments from IndexedDB (strictly scoped to active tenant)
    if (typeof window !== "undefined" && tenantId) {
      try {
        const pending = await getPendingMutations();
        const pendingPayments = pending.filter(
          (p) => p.entityType === "payment" && p.tenantId === tenantId
        );
        for (const p of pendingPayments) {
          const raw = p.payload?.paymentPayload;
          if (raw && !resultList.some((item) => item.id === p.entityId)) {
            resultList.unshift({
              id: p.entityId,
              tenantId: p.tenantId,
              paymentNumber: raw.payment_number || "PAY-PENDING",
              invoiceId: raw.invoice_id || "",
              invoiceNumber: raw.invoice_number || "",
              clientId: raw.client_id || "",
              clientName: raw.client_name || "Client",
              amount: parseFloat(raw.amount || "0"),
              currency: raw.currency || "INR",
              paymentDate: raw.payment_date || new Date().toISOString().split("T")[0],
              paymentMethod: raw.payment_method || "upi",
              transactionReference: raw.transaction_reference || undefined,
              notes: raw.notes || undefined,
              status: "completed",
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              _isPendingSync: true,
              _pendingStatus: p.status,
              _pendingMessage: "Saved locally — will sync when you're back online",
            });
          }
        }
      } catch {}
    }

    return tenantId ? resultList.filter((p) => p.tenantId === tenantId) : resultList;
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

      // Always persist to tenant-scoped localStorage for instant client responsiveness
      const existingLocal = getLocalPayments(tenantId);
      saveLocalPayments(tenantId, [newPayment, ...existingLocal.filter((p) => p.id !== paymentId)]);

      // 1. Prepare payment record payload
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

      let isQueuedOffline = false;
      try {
        const { error: insertErr } = await supabase.from("payments").insert([payload]);
        if (insertErr) {
          if (isNetworkError(insertErr)) {
            isQueuedOffline = true;
          } else {
            console.warn("Supabase payments insert warning:", insertErr);
          }
        }
      } catch (e) {
        if (isNetworkError(e)) {
          isQueuedOffline = true;
        } else {
          console.warn("Supabase payments insert warning:", e);
        }
      }

      // 2. If attached to an invoice, auto-update invoice paid_amount & balance_due
      let newBalance: number | undefined;
      let newStatus: string | undefined;
      let newPaid: number | undefined;

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
            newPaid = currentPaid + (payment.amount || 0);
            newBalance = Math.max(0, totalAmt - newPaid);
            newStatus = newBalance <= 0 ? "paid" : "partially_paid";

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
          if (isNetworkError(e)) {
            isQueuedOffline = true;
          } else {
            console.warn("Supabase invoice settlement sync warning:", e);
          }
        }
      }

      // If network was offline or failed with network error, queue mutation in IndexedDB
      if (isQueuedOffline || (typeof window !== "undefined" && !navigator.onLine)) {
        console.warn("[PaymentService] Network offline during payment insert. Enqueuing to IndexedDB...");
        await enqueueMutation({
          entityType: "payment",
          entityId: paymentId,
          action: "create",
          tenantId,
          displayTitle: `Payment #${paymentNumber} (${payment.currency || "₹"}${payment.amount || 0})`,
          payload: {
            paymentPayload: payload,
            invoiceId: payment.invoiceId || null,
            newBalance,
            newStatus,
            newPaid,
          },
        });

        return {
          ...newPayment,
          _isPendingSync: true,
          _pendingStatus: "pending",
          _pendingMessage: "Saved locally — will sync when you're back online",
        };
      }

      // 3. Dispatch Notification (isolated, non-blocking)
      try {
        const { NotificationService } = await import("./notification.service");
        NotificationService.notifyAction({
          type: "payment_received",
          title: `Payment Received (${payment.currency || "₹"}${payment.amount || 0})`,
          message: `Receipt #${paymentNumber} recorded for ${payment.clientName} via ${(payment.paymentMethod || "upi").toUpperCase()}.`,
          actionUrl: "/payments",
          clientName: payment.clientName,
          amount: payment.amount,
          entityType: "payment",
          entityId: paymentId,
        });
      } catch (notifErr) {
        console.warn("[PaymentService] Notification dispatch warning:", notifErr);
      }

      return newPayment;
    } catch (err) {
      console.error("PaymentService.recordPayment error:", err);
      return null;
    }
  },

  // Delete a payment receipt
  async deletePayment(id: string): Promise<boolean> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const existingLocal = getLocalPayments(tenantId);
      saveLocalPayments(tenantId, existingLocal.filter((p) => p.id !== id));

      await supabase.from("payments").delete().eq("id", id).eq("tenant_id", tenantId);
      return true;
    } catch (err) {
      console.error("PaymentService.deletePayment error:", err);
      return false;
    }
  },
};
