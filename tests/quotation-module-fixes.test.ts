import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateQuotation, validateQuotationLineItem } from "@/validations/quotation.schema";
import { QuotationService } from "@/services/quotation.service";
import { supabase } from "@/lib/supabase/client";
import { AuthService } from "@/services/auth.service";
import * as offlineQueue from "@/lib/offline-queue";
import * as networkDetector from "@/lib/network-detector";

describe("Module 4: Quotation Module Fixes & Lifecycle Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Quotation Validation Schema", () => {
    it("validates line item description and non-negative amount", () => {
      const emptyDesc = validateQuotationLineItem({ description: "   ", amount: 100 }, 0);
      expect(emptyDesc["items.0.description"]).toBe("Description is required");

      const negAmount = validateQuotationLineItem({ description: "Item 1", amount: -50 }, 0);
      expect(negAmount["items.0.amount"]).toBe("Valid non-negative amount is required");

      const negRate = validateQuotationLineItem({ description: "Item 1", amount: 100, rate: -10 }, 0);
      expect(negRate["items.0.rate"]).toBe("Rate cannot be negative");

      const zeroQty = validateQuotationLineItem({ description: "Item 1", amount: 100, quantity: 0 }, 0);
      expect(zeroQty["items.0.quantity"]).toBe("Quantity must be greater than zero");

      const invalidPercentDisc = validateQuotationLineItem(
        { description: "Item 1", amount: 100, discountType: "percentage", discountValue: 120 },
        0
      );
      expect(invalidPercentDisc["items.0.discountValue"]).toBe("Discount percentage cannot exceed 100%");
    });

    it("flags validity date preceding issue date", () => {
      const errors = validateQuotation({
        quotationNumber: "QT-1001",
        clientId: "client-1",
        clientName: "Acme Corp",
        date: "2026-10-20",
        validUntil: "2026-10-15",
        items: [{ id: "1", description: "Design Consultation", amount: 5000, quantity: 1, rate: 5000 }],
      });
      expect(errors.validUntil).toBe("Validity date cannot precede the issue date");
    });

    it("validates advance token percentages and fixed caps", () => {
      // Percentage > 100%
      const overPercent = validateQuotation({
        quotationNumber: "QT-1001",
        clientId: "client-1",
        date: "2026-10-20",
        validUntil: "2026-10-30",
        totalAmount: 10000,
        advanceType: "percentage",
        advanceValue: 150,
        items: [{ id: "1", description: "Services", amount: 10000 }],
      });
      expect(overPercent.advanceValue).toBe("Advance percentage must be between 0% and 100%");

      // Fixed advance exceeding total
      const overFixed = validateQuotation({
        quotationNumber: "QT-1001",
        clientId: "client-1",
        date: "2026-10-20",
        validUntil: "2026-10-30",
        totalAmount: 5000,
        advanceType: "fixed",
        advanceAmount: 8000,
        items: [{ id: "1", description: "Services", amount: 5000 }],
      });
      expect(overFixed.advanceAmount).toBe("Advance amount cannot exceed quotation total");
    });

    it("passes for completely valid quotation payload", () => {
      const errors = validateQuotation({
        quotationNumber: "QT-1001",
        clientId: "client-1",
        clientName: "Acme Corp",
        date: "2026-10-20",
        validUntil: "2026-10-30",
        totalAmount: 5000,
        advanceType: "percentage",
        advanceValue: 50,
        items: [{ id: "1", description: "Web Development", amount: 5000, quantity: 1, rate: 5000 }],
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe("Conversion URL Parameters & Phone Sanitization", () => {
    it("safely generates convert query string without leaking undefined or null", () => {
      function generateConvertUrl(quote: { id: string; clientId?: string | null }) {
        const params = new URLSearchParams({ fromQuoteId: quote.id });
        if (quote.clientId && quote.clientId !== "undefined" && quote.clientId !== "null") {
          params.set("clientId", quote.clientId);
        }
        return `/invoices/new?${params.toString()}`;
      }

      // Safe with valid clientId
      expect(generateConvertUrl({ id: "q1", clientId: "c1" })).toBe("/invoices/new?fromQuoteId=q1&clientId=c1");

      // Safe when clientId is missing
      expect(generateConvertUrl({ id: "q1", clientId: undefined })).toBe("/invoices/new?fromQuoteId=q1");

      // Safe when clientId is string "undefined"
      expect(generateConvertUrl({ id: "q1", clientId: "undefined" })).toBe("/invoices/new?fromQuoteId=q1");

      // Safe when clientId is null
      expect(generateConvertUrl({ id: "q1", clientId: null })).toBe("/invoices/new?fromQuoteId=q1");
    });

    it("sanitizes mobile dialer phone numbers while preserving international + prefix", () => {
      const rawPhone1 = "+91 98765-43210";
      const cleanPhone1 = rawPhone1.replace(/[^0-9+]/g, "");
      expect(cleanPhone1).toBe("+919876543210");

      const rawPhone2 = "(022) 2345 6789";
      const cleanPhone2 = rawPhone2.replace(/[^0-9+]/g, "");
      expect(cleanPhone2).toBe("02223456789");
    });
  });

  describe("Offline Resilience for Quotations", () => {
    it("enqueues delete mutation on network error in QuotationService.deleteQuotation", async () => {
      vi.spyOn(AuthService, "getActiveTenantId").mockResolvedValue("tenant-xyz");
      const enqueueSpy = vi.spyOn(offlineQueue, "enqueueMutation").mockResolvedValue({
        id: "mut-1",
        entityType: "quotation",
        entityId: "fake-quote-id",
        action: "delete",
        tenantId: "tenant-xyz",
        payload: { id: "fake-quote-id" },
        displayTitle: "Delete Quotation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0,
      });
      vi.spyOn(networkDetector, "isNetworkError").mockReturnValue(true);

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "Failed to fetch", status: 0 },
        }),
      });

      vi.spyOn(supabase, "from").mockReturnValue({
        delete: mockDelete,
      } as any);

      const ok = await QuotationService.deleteQuotation("fake-quote-id");

      expect(ok).toBe(true);
      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "quotation",
          entityId: "fake-quote-id",
          action: "delete",
          tenantId: "tenant-xyz",
        })
      );
    });
  });
});
