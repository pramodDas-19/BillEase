import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePayment, isPaymentValid, PAYMENT_METHODS } from "@/validations/payment.schema";
import { PaymentService } from "@/services/payment.service";
import { runOfflineSync } from "@/lib/offline-sync-runner";
import { supabase } from "@/lib/supabase/client";

// In-memory localStorage mock for node test environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => {
    storageMock[key] = val;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key in storageMock) delete storageMock[key];
  },
  key: (index: number) => Object.keys(storageMock)[index] ?? null,
  get length() {
    return Object.keys(storageMock).length;
  },
};

(global as any).localStorage = mockLocalStorage;
if (typeof window !== "undefined") {
  (window as any).localStorage = mockLocalStorage;
}

vi.mock("@/services/auth.service", () => ({
  AuthService: {
    getActiveTenantId: vi.fn().mockResolvedValue("tenant-test-101"),
  },
}));

vi.mock("@/lib/offline-queue", () => ({
  enqueueMutation: vi.fn().mockResolvedValue("mutation-123"),
  getPendingMutations: vi.fn().mockResolvedValue([]),
  updateMutationStatus: vi.fn().mockResolvedValue(true),
  removeMutation: vi.fn().mockResolvedValue(true),
  markMutationSynced: vi.fn().mockResolvedValue(true),
  markMutationFailed: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/services/client.service", () => ({
  ClientService: {
    recalculateClientLedger: vi.fn().mockResolvedValue({ totalBilled: 1000, totalPaid: 500, balanceDue: 500 }),
  },
}));

describe("Module 6: Payments, Receipts & Public Pay Portal Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe("Payment Validation Schema & Bounds", () => {
    it("rejects missing invoiceId", () => {
      const errors = validatePayment({
        invoiceId: "",
        amount: 500,
        paymentDate: "2026-10-19",
        paymentMethod: "upi",
      });
      expect(errors.invoiceId).toBe("Invoice is required");
      expect(isPaymentValid({ invoiceId: "", amount: 500, paymentDate: "2026-10-19", paymentMethod: "upi" })).toBe(false);
    });

    it("rejects non-positive payment amounts (<= 0)", () => {
      const errZero = validatePayment({
        invoiceId: "inv-1",
        amount: 0,
        paymentDate: "2026-10-19",
        paymentMethod: "upi",
      });
      expect(errZero.amount).toBe("Payment amount must be greater than zero");

      const errNeg = validatePayment({
        invoiceId: "inv-1",
        amount: -50,
        paymentDate: "2026-10-19",
        paymentMethod: "upi",
      });
      expect(errNeg.amount).toBe("Payment amount must be greater than zero");
    });

    it("rejects payment amounts exceeding balance due", () => {
      const errors = validatePayment(
        {
          invoiceId: "inv-1",
          amount: 6000,
          paymentDate: "2026-10-19",
          paymentMethod: "upi",
        },
        5000 // Max allowed balance due
      );
      expect(errors.amount).toContain("Amount cannot exceed balance due of ₹5,000");
    });

    it("accepts valid payment within balance due", () => {
      const data = {
        invoiceId: "inv-1",
        amount: 5000,
        paymentDate: "2026-10-19",
        paymentMethod: "upi" as const,
      };
      const errors = validatePayment(data, 5000);
      expect(Object.keys(errors).length).toBe(0);
      expect(isPaymentValid(data, 5000)).toBe(true);
    });

    it("validates payment methods properly", () => {
      expect(PAYMENT_METHODS).toContain("upi");
      expect(PAYMENT_METHODS).toContain("bank_transfer");
      expect(PAYMENT_METHODS).toContain("cash");

      const invalidMethod = validatePayment({
        invoiceId: "inv-101",
        amount: 2500,
        paymentDate: "2026-10-19",
        paymentMethod: "crypto" as any,
      });
      expect(invalidMethod.paymentMethod).toBe("Valid payment method is required");
    });
  });

  describe("Payment Deletion & Invoice Reversal", () => {
    it("reverses linked invoice paid_amount, balance_due and updates status to 'due' when payment is deleted", async () => {
      const tenantId = "tenant-test-101";

      // Seed local storage with target payment
      const paymentItem = {
        id: "pay-101",
        tenantId,
        paymentNumber: "PAY-001",
        invoiceId: "inv-999",
        invoiceNumber: "INV-999",
        clientId: "client-1",
        clientName: "Alpha Corp",
        amount: 5000,
        currency: "INR" as const,
        paymentDate: "2026-10-19",
        paymentMethod: "upi" as const,
        status: "completed" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockLocalStorage.setItem(`billease_payments_${tenantId}`, JSON.stringify([paymentItem]));

      // Seed local invoice with paidAmount: 5000, totalAmount: 5000, balanceDue: 0, status: 'paid'
      const invoiceItem = {
        id: "inv-999",
        tenantId,
        invoiceNumber: "INV-999",
        totalAmount: 5000,
        paidAmount: 5000,
        balanceDue: 0,
        status: "paid",
      };
      mockLocalStorage.setItem(`billease_invoices_${tenantId}`, JSON.stringify([invoiceItem]));

      // Mock Supabase calls
      let updatedInvoicePayload: any = null;
      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "payments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "pay-101",
                    client_id: "client-1",
                    invoice_id: "inv-999",
                    amount: 5000,
                    payment_number: "PAY-001",
                  },
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          } as any;
        }

        if (table === "invoices") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "inv-999",
                    total_amount: "5000",
                    paid_amount: "5000",
                    balance_due: "0",
                    status: "paid",
                  },
                }),
              }),
            }),
            update: vi.fn().mockImplementation((payload) => {
              updatedInvoicePayload = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          } as any;
        }
        return {} as any;
      });

      const success = await PaymentService.deletePayment("pay-101");
      expect(success).toBe(true);

      // Verify remote invoice was updated with reversal
      expect(updatedInvoicePayload).not.toBeNull();
      expect(updatedInvoicePayload.paid_amount).toBe(0);
      expect(updatedInvoicePayload.balance_due).toBe(5000);
      expect(updatedInvoicePayload.status).toBe("due");
    });
  });

  describe("Offline Sync Runner Replay for Payment Deletions", () => {
    it("successfully replays payment deletion and invoice balance adjustment", async () => {
      let deletedPaymentId: string | null = null;
      let updatedInvoicePayload: any = null;

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "payments") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                deletedPaymentId = val;
                return Promise.resolve({ error: null });
              }),
            }),
          } as any;
        }

        if (table === "invoices") {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatedInvoicePayload = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          } as any;
        }
        return {} as any;
      });

      const { getPendingMutations } = await import("@/lib/offline-queue");
      vi.mocked(getPendingMutations).mockResolvedValueOnce([
        {
          id: "mut-pay-del",
          entityType: "payment",
          entityId: "pay-101",
          action: "delete",
          tenantId: "tenant-test-101",
          displayTitle: "Delete Receipt #PAY-001",
          payload: {
            paymentId: "pay-101",
            invoiceId: "inv-999",
            amount: 5000,
            newPaid: 0,
            newBalance: 5000,
            newStatus: "due",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "pending",
          retryCount: 0,
        },
      ]);

      const result = await runOfflineSync();
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);

      expect(deletedPaymentId).toBe("pay-101");
      expect(updatedInvoicePayload).not.toBeNull();
      expect(updatedInvoicePayload.paid_amount).toBe(0);
      expect(updatedInvoicePayload.balance_due).toBe(5000);
      expect(updatedInvoicePayload.status).toBe("due");
    });
  });
});
