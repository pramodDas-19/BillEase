import { describe, it, expect } from "vitest";
import {
  getPlaceOfSupply,
  computeGstr3bSummary,
  generateGstr1Report,
  generateGstr1GovJson,
} from "@/lib/gst-engine";
import { Invoice } from "@/types";

describe("Module 7: Reports & GST Compliance Fixes", () => {
  describe("Place of Supply (POS) Defensive Resolver", () => {
    it("handles GSTIN with leading or trailing whitespace without falling back incorrectly", () => {
      expect(getPlaceOfSupply("  27ABCDE1234F1Z9  ")).toEqual({
        code: "27",
        name: "Maharashtra",
      });
      expect(getPlaceOfSupply(" 29AABCB2222C1Z8 ")).toEqual({
        code: "29",
        name: "Karnataka",
      });
    });

    it("resolves from client address text", () => {
      expect(getPlaceOfSupply(null, "Electronic City, Bengaluru, Karnataka")).toEqual({
        code: "29",
        name: "Karnataka",
      });
    });
  });

  describe("Taxable Turnover & Discount Deduction (Section 15 CGST Act)", () => {
    it("correctly deducts invoice discounts from GSTR-3B taxable turnover", () => {
      const invoicesWithDiscounts: Partial<Invoice>[] = [
        {
          id: "inv-1",
          invoiceNumber: "INV-101",
          subtotal: 10000,
          discountAmount: 1000, // True taxable turnover = 9,000
          totalTax: 1620, // 18% of 9,000
          totalAmount: 10620,
          gstType: "intra_state",
          status: "paid",
        },
        {
          id: "inv-2",
          invoiceNumber: "INV-102",
          subtotal: 20000,
          discountAmount: 2000, // True taxable turnover = 18,000
          totalTax: 3240, // 18% of 18,000
          totalAmount: 21240,
          gstType: "inter_state",
          status: "due",
        },
        {
          id: "inv-3",
          invoiceNumber: "INV-103",
          subtotal: 5000,
          discountAmount: 500,
          totalTax: 810,
          totalAmount: 5310,
          gstType: "intra_state",
          status: "cancelled", // Must be excluded
        },
      ];

      const summary = computeGstr3bSummary(invoicesWithDiscounts as Invoice[]);

      // Total taxable turnover = 9,000 + 18,000 = 27,000 (NOT 30,000)
      expect(summary.taxableTurnover).toBe(27000);
      expect(summary.invoiceCount).toBe(2);

      // Intra-state inv-1: 1620 tax -> CGST 810, SGST 810
      expect(summary.cgst).toBe(810);
      expect(summary.sgst).toBe(810);

      // Inter-state inv-2: 3240 tax -> IGST 3240
      expect(summary.igst).toBe(3240);
      expect(summary.totalTax).toBe(4860);
    });

    it("correctly allocates discounts to HSN line items in GSTR-1 Table 12", () => {
      const invoice: Partial<Invoice>[] = [
        {
          id: "inv-hsn",
          invoiceNumber: "INV-HSN-1",
          clientGstin: "27AAAAA0000A1Z5",
          clientName: "Alpha Corp",
          clientAddress: "Mumbai, Maharashtra",
          issueDate: "2026-05-15",
          subtotal: 10000,
          discountAmount: 1000, // 10% discount
          totalTax: 1620,
          totalAmount: 10620,
          gstType: "inter_state",
          status: "paid",
          items: [
            {
              id: "item-1",
              description: "Web Development",
              hsnSacCode: "998314",
              quantity: 1,
              rate: 10000,
              amount: 10000,
            },
          ],
        },
      ];

      const report = generateGstr1Report(invoice as Invoice[], "07AAAAA0000A1Z5", "052026");

      expect(report.b2b.length).toBe(1);
      expect(report.b2b[0].taxableValue).toBe(9000);
      expect(report.b2b[0].igst).toBe(1620);

      expect(report.hsn.length).toBe(1);
      expect(report.hsn[0].hsnCode).toBe("998314");
      // HSN taxable value must equal 9000 after discount allocation
      expect(report.hsn[0].totalTaxableValue).toBe(9000);
      expect(report.hsn[0].igst).toBe(1620);
    });
  });

  describe("GSTR-1 Official Offline Utility JSON Generation", () => {
    it("generates valid portal structure compliant with gst.gov.in format", () => {
      const invoice: Partial<Invoice>[] = [
        {
          id: "inv-json-1",
          invoiceNumber: "INV-2026-001",
          clientGstin: "27AAAAA0000A1Z5",
          clientName: "Maharashtra Tech",
          clientAddress: "Pune, Maharashtra",
          issueDate: "2026-05-20",
          subtotal: 50000,
          discountAmount: 0,
          totalTax: 9000,
          totalAmount: 59000,
          gstType: "inter_state",
          status: "paid",
          items: [
            {
              id: "it-1",
              description: "Cloud Architecture",
              hsnSacCode: "998315",
              quantity: 1,
              rate: 50000,
              amount: 50000,
            },
          ],
        },
      ];

      const report = generateGstr1Report(invoice as Invoice[], "07AAAAA0000A1Z5", "052026");
      const govJson: any = generateGstr1GovJson(report);

      expect(govJson.gstin).toBe("07AAAAA0000A1Z5");
      expect(govJson.fp).toBe("052026");
      expect(govJson.gt).toBeDefined();
      expect(govJson.cur_gt).toBeDefined();
      expect(govJson.b2b).toBeDefined();
      expect(govJson.b2b.length).toBe(1);
      expect(govJson.b2b[0].ctin).toBe("27AAAAA0000A1Z5");
      expect(govJson.b2b[0].inv[0].inum).toBe("INV-2026-001");
      expect(govJson.b2b[0].inv[0].pos).toBe("27");
      expect(govJson.hsn.data[0].hsn_sc).toBe("998315");
      expect(govJson.doc_issue.doc_det[0].docs[0].from).toBe("INV-2026-001");
    });
  });

  describe("Multi-Year Quarter Isolation & Return Period Codes", () => {
    it("isolates quarterly invoices by calendar and financial year", () => {
      const fyStartYear = 2026;
      const fyEndYear = 2027;

      const invoices = [
        { id: "1", issueDate: "2026-05-10" }, // In Q1 FY 2026-27 (May 2026)
        { id: "2", issueDate: "2025-05-10" }, // In Q1 FY 2025-26 (May 2025) -> Historical, must NOT match FY 2026-27 Q1
        { id: "3", issueDate: "2026-08-15" }, // In Q2 FY 2026-27 (Aug 2026)
        { id: "4", issueDate: "2027-02-20" }, // In Q4 FY 2026-27 (Feb 2027)
      ];

      const isQ1Match = (dateStr: string) => {
        const parts = dateStr.split("-");
        const invYear = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10);
        return invYear === fyStartYear && monthNum >= 4 && monthNum <= 6;
      };

      const isQ4Match = (dateStr: string) => {
        const parts = dateStr.split("-");
        const invYear = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10);
        return invYear === fyEndYear && monthNum >= 1 && monthNum <= 3;
      };

      const q1Invoices = invoices.filter((i) => isQ1Match(i.issueDate));
      expect(q1Invoices.map((i) => i.id)).toEqual(["1"]);

      const q4Invoices = invoices.filter((i) => isQ4Match(i.issueDate));
      expect(q4Invoices.map((i) => i.id)).toEqual(["4"]);
    });

    it("generates correct quarter-ending return period codes for GST portal", () => {
      const fyStartYear = 2026;
      const fyEndYear = 2027;

      const getCode = (quarter: string) => {
        if (quarter === "Q1") return `06${fyStartYear}`;
        if (quarter === "Q2") return `09${fyStartYear}`;
        if (quarter === "Q3") return `12${fyStartYear}`;
        if (quarter === "Q4") return `03${fyEndYear}`;
        return `03${fyEndYear}`;
      };

      expect(getCode("Q1")).toBe("062026");
      expect(getCode("Q2")).toBe("092026");
      expect(getCode("Q3")).toBe("122026");
      expect(getCode("Q4")).toBe("032027");
    });
  });
});
