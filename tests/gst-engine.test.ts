// ============================================================================
// BILLEASE SAAS — GST FILING ENGINE TESTS
// Verifies Place of Supply, GSTR-3B computation, GSTR-1 tables, and Gov JSON
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  getPlaceOfSupply,
  computeGstr3bSummary,
  generateGstr1Report,
  generateGstr1GovJson,
  generateGstr1Csv,
} from "../src/lib/gst-engine";
import { Invoice } from "../src/types";

describe("GST Place of Supply (POS) Resolver", () => {
  it("resolves state code and name from 2-digit GSTIN prefix", () => {
    expect(getPlaceOfSupply("07AAAAA0000A1Z5")).toEqual({ code: "07", name: "Delhi" });
    expect(getPlaceOfSupply("27ABCDE1234F1Z9")).toEqual({ code: "27", name: "Maharashtra" });
    expect(getPlaceOfSupply("29AABCB2222C1Z8")).toEqual({ code: "29", name: "Karnataka" });
    expect(getPlaceOfSupply("33AAACC3333D1Z7")).toEqual({ code: "33", name: "Tamil Nadu" });
  });

  it("resolves state from address text when GSTIN is missing", () => {
    expect(getPlaceOfSupply(null, "Whitefield, Bengaluru, Karnataka 560066")).toEqual({
      code: "29",
      name: "Karnataka",
    });
    expect(getPlaceOfSupply(null, "Andheri East, Mumbai, Maharashtra")).toEqual({
      code: "27",
      name: "Maharashtra",
    });
  });

  it("falls back to default code when neither GSTIN nor state matches", () => {
    expect(getPlaceOfSupply(null, "Unknown Location")).toEqual({ code: "07", name: "Delhi" });
  });
});

describe("GSTR-3B Outward Tax Liability Engine", () => {
  const sampleInvoices: Partial<Invoice>[] = [
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-001",
      subtotal: 10000,
      totalTax: 1800,
      totalAmount: 11800,
      gstType: "intra_state",
      status: "paid",
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-2026-002",
      subtotal: 20000,
      totalTax: 3600,
      totalAmount: 23600,
      gstType: "inter_state",
      status: "due",
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-2026-003",
      subtotal: 5000,
      totalTax: 900,
      totalAmount: 5900,
      gstType: "intra_state",
      status: "cancelled", // Cancelled should be excluded from tax turnover
    },
  ];

  it("correctly aggregates outward supplies and splits intra vs inter tax", () => {
    const summary = computeGstr3bSummary(sampleInvoices as Invoice[]);

    // Excludes cancelled invoice (10000 + 20000 = 30000)
    expect(summary.taxableTurnover).toBe(30000);
    expect(summary.totalInvoiceValue).toBe(35400);
    expect(summary.invoiceCount).toBe(2);

    // Intra-state inv-1: 1800 tax -> CGST: 900, SGST: 900
    expect(summary.cgst).toBe(900);
    expect(summary.sgst).toBe(900);

    // Inter-state inv-2: 3600 tax -> IGST: 3600
    expect(summary.igst).toBe(3600);

    // Total Tax Liability = 900 + 900 + 3600 = 5400
    expect(summary.totalTax).toBe(5400);
  });
});

describe("GSTR-1 Categorization Engine", () => {
  const invoicesForGstr1: Partial<Invoice>[] = [
    // 1. B2B Invoice: Registered client with valid 15-char GSTIN
    {
      id: "inv-b2b",
      invoiceNumber: "INV-001",
      clientGstin: "27AAAAA0000A1Z5",
      clientName: "Enterprise Corp",
      clientAddress: "Mumbai, Maharashtra",
      issueDate: "2026-04-10",
      subtotal: 50000,
      totalTax: 9000,
      totalAmount: 59000,
      gstType: "inter_state",
      status: "paid",
      items: [
        {
          id: "item-1",
          description: "Software Consulting",
          hsnSacCode: "998311",
          quantity: 1,
          rate: 50000,
          amount: 50000,
          taxRate: 18,
          taxAmount: 9000,
        },
      ],
    },
    // 2. B2C Small Invoice: Retail client without GSTIN
    {
      id: "inv-b2c",
      invoiceNumber: "INV-002",
      clientGstin: undefined,
      clientName: "Local Retail Customer",
      clientAddress: "Connaught Place, Delhi",
      issueDate: "2026-04-12",
      subtotal: 8000,
      totalTax: 1440,
      totalAmount: 9440,
      gstType: "intra_state",
      status: "due",
      items: [
        {
          id: "item-2",
          description: "Web Design Setup",
          hsnSacCode: "998314",
          quantity: 1,
          rate: 8000,
          amount: 8000,
          taxRate: 18,
          taxAmount: 1440,
        },
      ],
    },
    // 3. Cancelled Invoice
    {
      id: "inv-cancelled",
      invoiceNumber: "INV-003",
      clientGstin: undefined,
      clientName: "Draft Customer",
      issueDate: "2026-04-15",
      subtotal: 2000,
      totalTax: 360,
      totalAmount: 2360,
      status: "cancelled",
    },
  ];

  it("separates B2B and B2C correctly into GSTR-1 tables", () => {
    const report = generateGstr1Report(invoicesForGstr1 as Invoice[], "07AAAAA0000A1Z5", "042026");

    // Table 4A: B2B
    expect(report.b2b.length).toBe(1);
    expect(report.b2b[0].clientGstin).toBe("27AAAAA0000A1Z5");
    expect(report.b2b[0].invoiceNumber).toBe("INV-001");
    expect(report.b2b[0].taxableValue).toBe(50000);
    expect(report.b2b[0].igst).toBe(9000);
    expect(report.b2b[0].placeOfSupply).toBe("27-Maharashtra");

    // Table 7: B2CS
    expect(report.b2cs.length).toBe(1);
    expect(report.b2cs[0].taxableValue).toBe(8000);
    expect(report.b2cs[0].cgst).toBe(720);
    expect(report.b2cs[0].sgst).toBe(720);

    // Table 12: HSN Summary
    expect(report.hsn.length).toBe(2);
    const hsnConsulting = report.hsn.find((h) => h.hsnCode === "998311");
    expect(hsnConsulting).toBeDefined();
    expect(hsnConsulting?.totalTaxableValue).toBe(50000);
    expect(hsnConsulting?.igst).toBe(9000);

    // Table 13: Documents Issued
    expect(report.docIssues.length).toBe(1);
    expect(report.docIssues[0].totalCount).toBe(3);
    expect(report.docIssues[0].cancelledCount).toBe(1);
    expect(report.docIssues[0].netCount).toBe(2);
    expect(report.docIssues[0].fromSerial).toBe("INV-001");
    expect(report.docIssues[0].toSerial).toBe("INV-003");
  });

  it("generates valid Government Offline Tool JSON structure", () => {
    const report = generateGstr1Report(invoicesForGstr1 as Invoice[], "07AAAAA0000A1Z5", "042026");
    const govJson: any = generateGstr1GovJson(report);

    expect(govJson.gstin).toBe("07AAAAA0000A1Z5");
    expect(govJson.fp).toBe("042026");
    expect(govJson.b2b).toBeInstanceOf(Array);
    expect(govJson.b2b[0].ctin).toBe("27AAAAA0000A1Z5");
    expect(govJson.b2b[0].inv[0].inum).toBe("INV-001");
    expect(govJson.b2b[0].inv[0].pos).toBe("27");
    expect(govJson.hsn.data).toBeInstanceOf(Array);
    expect(govJson.doc_issue.doc_det).toBeInstanceOf(Array);
  });

  it("generates valid CSV format with UTF-8 BOM", () => {
    const report = generateGstr1Report(invoicesForGstr1 as Invoice[], "07AAAAA0000A1Z5", "042026");
    const csv = generateGstr1Csv(report);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("GSTR-3B OUTWARD TAXABLE SUPPLIES");
    expect(csv).toContain("GSTR-1 TABLE 4A: B2B INVOICES");
    expect(csv).toContain("27AAAAA0000A1Z5");
    expect(csv).toContain("GSTR-1 TABLE 12: HSN / SAC SUMMARY");
    expect(csv).toContain("998311");
  });
});
