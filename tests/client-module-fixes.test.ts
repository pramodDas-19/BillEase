import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateClient } from "@/validations/client.schema";
import { ClientService } from "@/services/client.service";
import { supabase } from "@/lib/supabase/client";

describe("Module 2: Client Management & CRM / Ledger Bug Fix Verifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation & State Code Verifications", () => {
    it("TEST 1: Valid client with valid Indian GSTIN passes validation", () => {
      const errors = validateClient({
        name: "Acme Enterprises",
        phone: "+91 98765 43210",
        email: "contact@acme.com",
        gstin: "27AAPFU0939F1ZV", // Maharashtra (27)
      });

      expect(Object.keys(errors).length).toBe(0);
      expect(errors.name).toBeUndefined();
      expect(errors.phone).toBeUndefined();
      expect(errors.gstin).toBeUndefined();
    });

    it("TEST 2: GSTIN with invalid state code is rejected", () => {
      const errors = validateClient({
        name: "Apex Logistics",
        phone: "9876543210",
        gstin: "99AAPFU0939F1ZV", // Invalid state code 99
      });

      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.gstin).toBeDefined();
      expect(errors.gstin).toContain("Invalid GST State Code");
    });

    it("TEST 3: GSTIN with invalid checksum / characters is rejected", () => {
      const errors = validateClient({
        name: "Apex Logistics",
        phone: "9876543210",
        gstin: "27AAPFU0939F1Z", // Only 14 characters
      });

      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.gstin).toBeDefined();
      expect(errors.gstin).toContain("15 characters");
    });

    it("TEST 4: Short phone number is rejected", () => {
      const errors = validateClient({
        name: "Apex Logistics",
        phone: "12345",
      });

      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.phone).toBeDefined();
      expect(errors.phone).toContain("valid phone number");
    });
  });

  describe("Client Deletion Safety Guard", () => {
    it("TEST 5: deleteClient fails safely when active invoices are linked to the client", async () => {
      // Mock supabase select returning linked invoices
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ id: "inv-1", invoice_number: "INV-2026-001" }],
            error: null,
          }),
        }),
      });

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "invoices") {
          return { select: mockSelect } as any;
        }
        return {} as any;
      });

      const result = await ClientService.deleteClient("client-uuid-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot delete client: 1 linked invoice(s) exist");
      expect(result.error).toContain("INV-2026-001");
    });

    it("TEST 6: deleteClient succeeds when no linked invoices exist", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "invoices") {
          return { select: mockSelect } as any;
        }
        if (table === "clients") {
          return { delete: mockDelete } as any;
        }
        return {} as any;
      });

      const result = await ClientService.deleteClient("client-uuid-456");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Ledger Calculation Integrity", () => {
    it("TEST 7: recalculateClientLedger calculates billed, paid, and balanceDue, ignoring cancelled invoices", async () => {
      const mockInvoices = [
        { total_amount: 15000, paid_amount: 10000, status: "partial" },
        { total_amount: 5000, paid_amount: 5000, status: "paid" },
        { total_amount: 20000, paid_amount: 0, status: "cancelled" }, // should be ignored
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockInvoices,
          error: null,
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "invoices") {
          return { select: mockSelect } as any;
        }
        if (table === "clients") {
          return { update: mockUpdate } as any;
        }
        return {} as any;
      });

      const ledger = await ClientService.recalculateClientLedger("client-uuid-789");

      expect(ledger).not.toBeNull();
      // Total billed should be 15000 + 5000 = 20000 (excluding 20000 cancelled)
      expect(ledger?.totalBilled).toBe(20000);
      // Total paid should be 10000 + 5000 = 15000
      expect(ledger?.totalPaid).toBe(15000);
      // Balance due should be 20000 - 15000 = 5000
      expect(ledger?.balanceDue).toBe(5000);

      // Verify supabase update was called with the calculated ledger values
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          total_billed: 20000,
          total_paid: 15000,
          balance_due: 5000,
        })
      );
    });
  });
});
