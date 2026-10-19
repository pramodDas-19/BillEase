import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateService, STANDARD_GST_SLABS } from "@/validations/service.schema";
import { CatalogService } from "@/services/service.service";
import { supabase } from "@/lib/supabase/client";
import { DataCache } from "@/lib/data-cache";

describe("Module 3: Services Catalog & Inventory Bug Fix Verifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    DataCache.invalidate("services");
  });

  describe("Validation & GST Slab Verifications", () => {
    it("TEST 1: Valid service with valid HSN and 18% GST passes validation with 0 errors", () => {
      const errors = validateService({
        name: "Website UI/UX Design",
        category: "Design & Creative",
        rate: 25000,
        unit: "Project",
        hsnSac: "998314",
        gstRate: 18,
      });

      expect(Object.keys(errors).length).toBe(0);
      expect(errors.name).toBeUndefined();
      expect(errors.rate).toBeUndefined();
      expect(errors.gstRate).toBeUndefined();
      expect(errors.hsnSac).toBeUndefined();
    });

    it("TEST 2: Negative rate is rejected with field error", () => {
      const errors = validateService({
        name: "Consulting Hour",
        rate: -500,
      });

      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.rate).toBeDefined();
      expect(errors.rate).toContain("non-negative");
    });

    it("TEST 3: GST rate out of 0-100 range is rejected", () => {
      const errors = validateService({
        name: "Printing Paper",
        rate: 100,
        gstRate: 150,
      });

      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.gstRate).toBeDefined();
      expect(errors.gstRate).toContain("between 0% and 100%");
    });

    it("TEST 4: Invalid HSN/SAC code with non-digits or wrong length is rejected", () => {
      const errorLetters = validateService({
        name: "Brochure Print",
        hsnSac: "SAC998",
      });
      expect(errorLetters.hsnSac).toBeDefined();
      expect(errorLetters.hsnSac).toContain("2 to 8 numeric digits");

      const errorTooLong = validateService({
        name: "Brochure Print",
        hsnSac: "1234567890", // 10 digits
      });
      expect(errorTooLong.hsnSac).toBeDefined();
    });

    it("TEST 5: Empty item name is rejected", () => {
      const errors = validateService({
        name: "   ",
        rate: 500,
      });

      expect(errors.name).toBeDefined();
      expect(errors.name).toContain("Item / Service name is required");
    });

    it("TEST 6: Standard GST slabs include 0, 5, 12, 18, and 28", () => {
      expect(STANDARD_GST_SLABS).toEqual([0, 5, 12, 18, 28]);
    });
  });

  describe("CatalogService DataCache & Persistence Integration", () => {
    it("TEST 7: CatalogService.getServices caches results and invalidates on delete", async () => {
      const mockItems = [
        {
          id: "srv-001",
          tenant_id: "tenant-apex-1",
          name: "SEO Audit",
          category: "Technical / Development",
          rate: 12000,
          unit: "Audit",
          hsn_sac: "998313",
          gst_rate: 18,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const selectSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockItems,
            error: null,
          }),
        }),
      });

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "services") {
          return { select: selectSpy, delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) } as any;
        }
        return {} as any;
      });

      // First call fetches from database
      const firstCall = await CatalogService.getServices();
      expect(firstCall).toHaveLength(1);
      expect(firstCall[0].name).toBe("SEO Audit");
      expect(selectSpy).toHaveBeenCalledTimes(1);

      // Second call is served from DataCache without hitting Supabase again
      const secondCall = await CatalogService.getServices();
      expect(secondCall).toHaveLength(1);
      expect(selectSpy).toHaveBeenCalledTimes(1); // Still 1!

      // Deleting a service invalidates DataCache
      const deleteResult = await CatalogService.deleteService("srv-001");
      expect(deleteResult).toBe(true);

      // Subsequent call re-queries Supabase
      await CatalogService.getServices();
      expect(selectSpy).toHaveBeenCalledTimes(2);
    });
  });
});
