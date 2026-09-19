import { describe, it, expect } from "vitest";
import {
  DOCUMENT_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
} from "../src/config/document-templates";
import { normalizeDocument } from "../src/components/documents/templates/shared/template-adapter";
import { Invoice, Quotation, Tenant } from "../src/types";

describe("15 Document Templates Suite", () => {
  it("registers exactly 15 templates across 3 size categories (5 A4, 5 A5, 5 Thermal)", () => {
    expect(DOCUMENT_TEMPLATES).toHaveLength(15);

    const a4 = getTemplatesByCategory("a4");
    const a5 = getTemplatesByCategory("a5");
    const thermal = getTemplatesByCategory("thermal");

    expect(a4).toHaveLength(5);
    expect(a5).toHaveLength(5);
    expect(thermal).toHaveLength(5);
  });

  it("verifies all 5 A4 template IDs exist", () => {
    const a4Ids = [
      "a4_advanced_gst",
      "a4_tally",
      "a4_luxury",
      "a4_modern",
      "a4_billbook",
    ];

    a4Ids.forEach((id) => {
      const tmpl = getTemplateById(id);
      expect(tmpl.id).toBe(id);
      expect(tmpl.category).toBe("a4");
      expect(tmpl.paperWidthMm).toBe(210);
    });
  });

  it("verifies all 5 A5 template IDs exist with appropriate orientation", () => {
    const a5Ids = [
      "a5_landscape_gst",
      "a5_landscape_billbook",
      "a5_portrait_challan",
      "a5_portrait_modern",
      "a5_traditional_bahi",
    ];

    a5Ids.forEach((id) => {
      const tmpl = getTemplateById(id);
      expect(tmpl.id).toBe(id);
      expect(tmpl.category).toBe("a5");
      expect(tmpl.paperWidthMm).toBeGreaterThan(0);
    });

    const landscape = getTemplateById("a5_landscape_gst");
    expect(landscape.orientation).toBe("landscape");

    const portrait = getTemplateById("a5_portrait_challan");
    expect(portrait.orientation).toBe("portrait");
  });

  it("verifies all 5 Thermal template IDs exist", () => {
    const thermalIds = [
      "thermal_80mm_standard",
      "thermal_80mm_gst_qr",
      "thermal_58mm_compact",
      "thermal_boutique_cafe",
      "thermal_grocery_retail",
    ];

    thermalIds.forEach((id) => {
      const tmpl = getTemplateById(id);
      expect(tmpl.id).toBe(id);
      expect(tmpl.category).toBe("thermal");
      expect([58, 80]).toContain(tmpl.paperWidthMm);
    });
  });

  it("normalizes an Indian GST Invoice correctly with multi-slab tax & UPI payment", () => {
    const mockInvoice: Invoice = {
      id: "inv-test-1",
      tenantId: "tenant-1",
      invoiceNumber: "INV-2026-001",
      clientId: "client-1",
      clientName: "Mohit Sharma",
      clientCompanyName: "Sharma Traders",
      clientAddress: "521 Shastri Nagar, Dadabari, Kota, Rajasthan",
      clientGstin: "08AABCS1429B1Z1",
      issueDate: "2026-09-15",
      dueDate: "2026-09-30",
      status: "sent",
      currency: "INR",
      items: [
        {
          id: "item-1",
          description: "Samsung A30 Galaxy",
          hsnSacCode: "8517",
          quantity: 2,
          unit: "PCS",
          rate: 10000,
          amount: 20000,
          taxRate: 18,
          taxAmount: 3600,
        },
      ],
      subtotal: 20000,
      totalAmount: 23600,
      paidAmount: 5000,
      balanceDue: 18600,
      isTaxEnabled: true,
      gstType: "intra_state",
      totalTax: 3600,
      taxBreakdown: [{ rate: 18, amount: 3600, name: "GST 18%" }],
      createdAt: "2026-09-15",
      updatedAt: "2026-09-15",
    };

    const mockTenant: Tenant = {
      id: "tenant-1",
      businessName: "Moira Enterprises",
      slug: "moira",
      businessType: "printing_press",
      ownerName: "Moira",
      email: "info@moira.com",
      phone: "+91 9876543210",
      gstin: "08BDNPX7777B1Z2",
      settings: {
        defaultCurrency: "INR",
        enableGstByDefault: true,
        defaultQuotationValidityDays: 15,
        defaultInvoiceDueDays: 15,
        quotationNumbering: { prefix: "QT-", nextNumber: 1, digitLength: 4 },
        invoiceNumbering: { prefix: "INV-", nextNumber: 1, digitLength: 4 },
      },
      bankDetails: {
        accountName: "Moira Enterprises",
        accountNumber: "919876543210",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
        upiId: "moira@hdfc",
      },
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const doc = normalizeDocument(mockInvoice, "invoice", mockTenant);

    expect(doc.documentTitle).toBe("TAX INVOICE");
    expect(doc.documentNumber).toBe("INV-2026-001");
    expect(doc.tenant.businessName).toBe("Moira Enterprises");
    expect(doc.tenant.gstin).toBe("08BDNPX7777B1Z2");
    expect(doc.client.name).toBe("Mohit Sharma");
    expect(doc.client.gstin).toBe("08AABCS1429B1Z1");
    expect(doc.totalAmount).toBe(23600);
    expect(doc.balanceDue).toBe(18600);
    expect(doc.receivedAmount).toBe(5000);
    expect(doc.totalInWords.toLowerCase()).toContain("twenty three thousand");
    expect(doc.upiUri).toContain("upi://pay?");
    expect(doc.upiUri).toContain("pa=moira%40hdfc");
    expect(doc.hasHsn).toBe(true);
    expect(doc.taxBreakdown).toHaveLength(1);
    expect(doc.taxBreakdown[0].cgstAmount).toBe(1800);
    expect(doc.taxBreakdown[0].sgstAmount).toBe(1800);
  });

  it("normalizes a Quotation into appropriate quotation terminology", () => {
    const mockQuotation: Quotation = {
      id: "quote-1",
      tenantId: "tenant-1",
      quotationNumber: "QT-2026-042",
      clientId: "client-2",
      clientName: "Rahul Verma",
      date: "2026-09-15",
      validUntil: "2026-09-30",
      status: "sent",
      items: [
        {
          id: "item-q",
          description: "Graphic Designing & Brochure Print",
          quantity: 100,
          rate: 45,
          amount: 4500,
        },
      ],
      subtotal: 4500,
      totalAmount: 4500,
      totalTax: 0,
      isTaxEnabled: false,
      currency: "INR",
      createdAt: "2026-09-15",
      updatedAt: "2026-09-15",
    };

    const doc = normalizeDocument(mockQuotation, "quotation", null);

    expect(doc.documentTitle).toBe("ESTIMATE / QUOTATION");
    expect(doc.documentNumber).toBe("QT-2026-042");
    expect(doc.dueDateOrValidUntil.label).toBe("Valid Until");
    expect(doc.totalAmount).toBe(4500);
    expect(doc.balanceDue).toBe(4500);
  });

  it("strictly preserves optional shippingAddress and placeOfSupply without phantom fallbacks", () => {
    const quoteWithoutOptional: Quotation = {
      id: "quote-no-opt",
      tenantId: "tenant-1",
      clientId: "client-opt-1",
      quotationNumber: "QT-2026-099",
      clientName: "Freelance Client",
      clientAddress: "123 Main Street, Bangalore",
      date: "2026-09-19",
      validUntil: "2026-10-04",
      status: "draft",
      isTaxEnabled: false,
      items: [{ id: "1", description: "Design Consulting", amount: 15000 }],
      subtotal: 15000,
      totalAmount: 15000,
      totalTax: 0,
      currency: "INR",
      createdAt: "2026-09-19",
      updatedAt: "2026-09-19",
    };

    const doc1 = normalizeDocument(quoteWithoutOptional, "quotation", null);
    expect(doc1.shippingAddress).toBeUndefined();
    expect(doc1.placeOfSupply).toBeUndefined();
    expect(doc1.client.address).toBe("123 Main Street, Bangalore");

    const quoteWithOptional: Quotation = {
      ...quoteWithoutOptional,
      shippingAddress: "Warehouse 4B, Electronic City, Bangalore",
      placeOfSupply: "Karnataka (29)",
    };

    const doc2 = normalizeDocument(quoteWithOptional, "quotation", null);
    expect(doc2.shippingAddress).toBe("Warehouse 4B, Electronic City, Bangalore");
    expect(doc2.placeOfSupply).toBe("Karnataka (29)");

    // Ensure totalInWords does not contain duplicate "Only Only"
    expect(doc2.totalInWords).toMatch(/Only$/);
    expect(doc2.totalInWords).not.toMatch(/Only\s+Only/i);
  });
});
