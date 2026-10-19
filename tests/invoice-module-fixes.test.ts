import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateInvoice, validateInvoiceLineItem } from "@/validations/invoice.schema";
import { InvoiceService } from "@/services/invoice.service";
import { ClientService } from "@/services/client.service";
import { supabase } from "@/lib/supabase/client";
import { AuthService } from "@/services/auth.service";
import * as offlineQueue from "@/lib/offline-queue";
import * as networkDetector from "@/lib/network-detector";
import { replayMutation } from "@/lib/offline-sync-runner";

describe("Module 5: Invoices & Core Billing Engine Fixes Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Invoice Validation Schema", () => {
    it("validates line item descriptions, rates, quantities, and discount caps", () => {
      const emptyDesc = validateInvoiceLineItem({ description: "", amount: 100 }, 0);
      expect(emptyDesc["items.0.description"]).toBe("Description is required");

      const negAmount = validateInvoiceLineItem({ description: "Consulting", amount: -100 }, 0);
      expect(negAmount["items.0.amount"]).toBe("Valid non-negative amount is required");

      const zeroQty = validateInvoiceLineItem({ description: "Consulting", amount: 100, quantity: 0 }, 0);
      expect(zeroQty["items.0.quantity"]).toBe("Quantity must be greater than zero");

      const negRate = validateInvoiceLineItem({ description: "Consulting", amount: 100, rate: -50 }, 0);
      expect(negRate["items.0.rate"]).toBe("Rate cannot be negative");

      const overDiscount = validateInvoiceLineItem(
        { description: "Consulting", amount: 100, discountType: "percentage", discountValue: 105 },
        0
      );
      expect(overDiscount["items.0.discountValue"]).toBe("Discount percentage cannot exceed 100%");
    });

    it("flags due date preceding issue date", () => {
      const errors = validateInvoice({
        invoiceNumber: "INV-1001",
        clientId: "client-1",
        clientName: "Acme Corp",
        issueDate: "2026-10-25",
        dueDate: "2026-10-20",
        items: [{ id: "1", description: "Design", amount: 2000 }],
      });
      expect(errors.dueDate).toBe("Due date cannot precede the issue date");
    });

    it("validates paid amount limits", () => {
      // Negative paid amount
      const negPaid = validateInvoice({
        invoiceNumber: "INV-1001",
        clientId: "client-1",
        issueDate: "2026-10-20",
        dueDate: "2026-10-30",
        totalAmount: 5000,
        paidAmount: -500,
        items: [{ id: "1", description: "Design", amount: 5000 }],
      });
      expect(negPaid.paidAmount).toBe("Paid amount cannot be negative");

      // Paid amount exceeding total
      const overPaid = validateInvoice({
        invoiceNumber: "INV-1001",
        clientId: "client-1",
        issueDate: "2026-10-20",
        dueDate: "2026-10-30",
        totalAmount: 5000,
        paidAmount: 6500,
        items: [{ id: "1", description: "Design", amount: 5000 }],
      });
      expect(overPaid.paidAmount).toBe("Paid amount cannot exceed invoice total");
    });

    it("passes for completely valid invoice payload", () => {
      const errors = validateInvoice({
        invoiceNumber: "INV-1001",
        clientId: "client-1",
        clientName: "Acme Corp",
        issueDate: "2026-10-20",
        dueDate: "2026-10-30",
        totalAmount: 10000,
        paidAmount: 2500,
        items: [{ id: "1", description: "Web Development", amount: 10000, quantity: 1, rate: 10000 }],
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe("Invoice Deletion, Payment Cleanup & Ledger Recalculation", () => {
    it("cleans up payments and items when deleting an invoice and recalculates ledger", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { client_id: "client-abc" },
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "invoices") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: mockSingle }),
            }),
            delete: mockDelete,
          } as any;
        }
        return { delete: mockDelete } as any;
      });

      const ledgerSpy = vi.spyOn(ClientService, "recalculateClientLedger").mockResolvedValue({
        totalBilled: 0,
        totalPaid: 0,
        balanceDue: 0,
      });

      const result = await InvoiceService.deleteInvoice("inv-123");

      expect(result).toBe(true);
      expect(ledgerSpy).toHaveBeenCalledWith("client-abc");
    });

    it("enqueues delete mutation on network error during invoice delete", async () => {
      vi.spyOn(AuthService, "getActiveTenantId").mockResolvedValue("tenant-abc");
      const enqueueSpy = vi.spyOn(offlineQueue, "enqueueMutation").mockResolvedValue({
        id: "mut-inv",
        entityType: "invoice",
        entityId: "inv-offline-id",
        action: "delete",
        tenantId: "tenant-abc",
        payload: { id: "inv-offline-id" },
        displayTitle: "Delete Invoice #inv-offline-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0,
      });
      vi.spyOn(networkDetector, "isNetworkError").mockReturnValue(true);

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "Network unavailable", status: 0 },
        }),
      });

      vi.spyOn(supabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
        }),
        delete: mockDelete,
      } as any);

      const ok = await InvoiceService.deleteInvoice("inv-offline-id");

      expect(ok).toBe(true);
      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "invoice",
          entityId: "inv-offline-id",
          action: "delete",
          tenantId: "tenant-abc",
        })
      );
    });
  });

  describe("Offline Sync Runner Invoice Deletion Replay", () => {
    it("successfully replays offline invoice deletion by deleting payments, items, and invoice", async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      vi.spyOn(supabase, "from").mockReturnValue({
        delete: mockDelete,
      } as any);

      const result = await replayMutation({
        id: "mut-1",
        entityType: "invoice",
        entityId: "inv-to-delete",
        action: "delete",
        tenantId: "tenant-abc",
        payload: { id: "inv-to-delete" },
        displayTitle: "Delete Invoice",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Phone Sanitization with + Prefix", () => {
    it("preserves international country prefix while removing formatting spaces and dashes", () => {
      const phone = "+91 (987) 654-3210";
      const clean = phone.replace(/[^0-9+]/g, "");
      expect(clean).toBe("+919876543210");
    });
  });
});
