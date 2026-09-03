import { describe, it, expect } from "vitest";
import { calculateDocumentTotals } from "@/lib/calculation";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { generateCsvContent, CsvColumn } from "@/lib/export-csv";
import { formatWhatsAppPhoneNumber, getWhatsAppInvoiceShareUrl } from "@/lib/whatsapp";
import { validateInvoiceInput, validateQuotationInput, validateClientInput } from "@/lib/server-validations";
import { urlBase64ToUint8Array, VAPID_PUBLIC_KEY } from "@/lib/web-push";



describe("Financial Calculation Engine", () => {
  it("computes standard Intra-State GST with exact CGST/SGST split", () => {
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Wedding Photography", amount: 10000 }],
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "intra_state",
    });

    expect(result.subtotal).toBe(10000);
    expect(result.taxableAmount).toBe(10000);
    expect(result.totalTax).toBe(1800);
    expect(result.totalAmount).toBe(11800);
    expect(result.taxBreakdown).toHaveLength(2);
    expect(result.taxBreakdown[0]).toEqual({ name: "CGST (9%)", rate: 9, amount: 900 });
    expect(result.taxBreakdown[1]).toEqual({ name: "SGST (9%)", rate: 9, amount: 900 });
  });

  it("computes Inter-State GST with IGST", () => {
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Video Editing Out of State", amount: 20000 }],
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "inter_state",
    });

    expect(result.subtotal).toBe(20000);
    expect(result.taxableAmount).toBe(20000);
    expect(result.totalTax).toBe(3600);
    expect(result.totalAmount).toBe(23600);
    expect(result.taxBreakdown).toHaveLength(1);
    expect(result.taxBreakdown[0]).toEqual({ name: "IGST (18%)", rate: 18, amount: 3600 });
  });

  it("produces clean zero tax when isTaxEnabled is false (unregistered freelancers)", () => {
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Logo Design", amount: 15000 }],
      isTaxEnabled: false,
      defaultTaxRate: 18,
    });

    expect(result.subtotal).toBe(15000);
    expect(result.taxableAmount).toBe(15000);
    expect(result.totalTax).toBe(0);
    expect(result.totalAmount).toBe(15000);
    expect(result.taxBreakdown).toEqual([]);
  });

  it("applies percentage discount before calculating tax", () => {
    // 10,000 with 10% discount = 9,000 taxable. 18% tax on 9,000 = 1,620. Total = 10,620.
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Event Stage Decor", amount: 10000 }],
      discountType: "percentage",
      discountValue: 10,
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "intra_state",
    });

    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(1000);
    expect(result.taxableAmount).toBe(9000);
    expect(result.totalTax).toBe(1620);
    expect(result.totalAmount).toBe(10620);
    expect(result.taxBreakdown[0].amount).toBe(810); // CGST 9% of 9000
    expect(result.taxBreakdown[1].amount).toBe(810); // SGST 9% of 9000
  });

  it("applies fixed discount before calculating tax", () => {
    // 5,000 with 500 fixed discount = 4,500 taxable. 18% tax = 810. Total = 5,310.
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Print 500 Brochures", amount: 5000 }],
      discountType: "fixed",
      discountValue: 500,
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "inter_state",
    });

    expect(result.subtotal).toBe(5000);
    expect(result.discountAmount).toBe(500);
    expect(result.taxableAmount).toBe(4500);
    expect(result.totalTax).toBe(810);
    expect(result.totalAmount).toBe(5310);
  });

  it("handles odd cent split rounding with mathematical parity", () => {
    // 105 at 18% = 18.90 total tax.
    // CGST = 9.45, SGST = 9.45.
    const result = calculateDocumentTotals({
      items: [{ id: "1", description: "Minor repair", amount: 105 }],
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "intra_state",
    });

    expect(result.totalTax).toBe(18.9);
    expect(result.taxBreakdown[0].amount).toBe(9.45);
    expect(result.taxBreakdown[1].amount).toBe(9.45);
    expect(result.totalAmount).toBe(123.9);
  });
});

describe("Local Offline UPI QR Code Generator", () => {
  it("generates a valid UPI payment intent URI", () => {
    const uri = generateUpiIntentUrl({
      upiId: "studio@okaxis",
      businessName: "Studio Royal",
      amount: 15000,
      transactionRef: "INV-2026-001",
      note: "Wedding Photography Balance",
    });

    expect(uri).toContain("upi://pay?");
    expect(uri).toContain("pa=studio%40okaxis");
    expect(uri).toContain("pn=Studio%20Royal");
    expect(uri).toContain("am=15000.00");
    expect(uri).toContain("cu=INR");
  });

  it("renders a 100% local SVG QR data URI without third-party network calls", () => {
    const uri = generateUpiIntentUrl({
      upiId: "studio@okaxis",
      businessName: "Studio Royal",
      amount: 500,
    });

    const qrDataUri = getUpiQrImageUrl(uri, 300);

    expect(qrDataUri).toContain("data:image/svg+xml;utf8,");
    expect(qrDataUri).toContain("%3Csvg");
    expect(qrDataUri).toContain("%3Cpath");
    expect(qrDataUri).not.toContain("api.qrserver.com");
  });
});

describe("CSV / Excel Data Export Utility", () => {
  it("escapes commas, quotes, and newlines and prepends UTF-8 BOM", () => {
    interface SampleData {
      name: string;
      notes: string;
      amount: number;
    }

    const cols: CsvColumn<SampleData>[] = [
      { label: "Customer Name", getValue: (d) => d.name },
      { label: "Notes", getValue: (d) => d.notes },
      { label: "Amount", getValue: (d) => d.amount },
    ];

    const data: SampleData[] = [
      {
        name: 'John "The Boss", Doe',
        notes: "Advance paid: 50%\nPending on delivery",
        amount: 25000,
      },
    ];

    const csv = generateCsvContent(cols, data);

    // Checks UTF-8 BOM (\uFEFF)
    expect(csv.startsWith("\uFEFF")).toBe(true);
    // Checks quote escaping
    expect(csv).toContain('"John ""The Boss"", Doe"');
    // Checks multiline wrapping
    expect(csv).toContain('"Advance paid: 50%\nPending on delivery"');
    expect(csv).toContain("25000");
  });
});

describe("Professional WhatsApp Notification Engine", () => {
  it("auto-normalizes 10-digit Indian numbers with 91 country code", () => {
    expect(formatWhatsAppPhoneNumber("9876543210")).toBe("919876543210");
    expect(formatWhatsAppPhoneNumber("+91 98765 43210")).toBe("919876543210");
    expect(formatWhatsAppPhoneNumber("09876543210")).toBe("919876543210");
    expect(formatWhatsAppPhoneNumber("")).toBe("");
  });

  it("generates a professional WhatsApp bill share link with business branding and tokenized payment URL", () => {
    const url = getWhatsAppInvoiceShareUrl({
      clientPhone: "9876543210",
      clientName: "Rohan Verma",
      invoiceNumber: "INV-2026-88",
      invoiceId: "inv-123",
      publicToken: "550e8400-e29b-41d4-a716-446655440000",
      totalAmount: 25000,
      balanceDue: 25000,
      businessName: "Elite Media Works",
    });

    expect(url).toContain("https://wa.me/919876543210?text=");
    const decodedMessage = decodeURIComponent(url);
    expect(decodedMessage).toContain("Hello *Rohan Verma*");
    expect(decodedMessage).toContain("TAX INVOICE #INV-2026-88* from *Elite Media Works*");
    expect(decodedMessage).toContain("/pay/550e8400-e29b-41d4-a716-446655440000");
    expect(decodedMessage).toContain("Elite Media Works");
  });
});

describe("Server-Side Input Validation Suite", () => {
  it("rejects invoices with missing client name or empty items", () => {
    const invalidInvoice = {
      clientName: "",
      items: [],
    };
    const result = validateInvoiceInput(invalidInvoice);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Client name is required and cannot be empty.");
    expect(result.errors).toContain("Invoice must contain at least one line item.");
  });

  it("rejects negative amounts on line items", () => {
    const invalidItemInvoice = {
      clientName: "Good Client",
      items: [{ description: "Bad Item", amount: -500 }],
    };
    const result = validateInvoiceInput(invalidItemInvoice);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Line item #1 amount must be a positive number.");
  });

  it("accepts a fully valid invoice payload", () => {
    const validInvoice = {
      clientName: "Tech Corp India",
      issueDate: "2026-09-03",
      dueDate: "2026-09-17",
      items: [{ description: "Annual SaaS License", amount: 45000 }],
      subtotal: 45000,
      totalAmount: 53100,
    };
    const result = validateInvoiceInput(validInvoice);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates client GSTIN length if provided", () => {
    const invalidGstinClient = {
      name: "Acme Trader",
      gstin: "12345", // too short (must be 15)
    };
    const res = validateClientInput(invalidGstinClient);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain("GSTIN must be exactly 15 characters.");
  });
});

describe("Real Web Push (VAPID) Engine", () => {
  it("provides a valid VAPID public key and decodes to Uint8Array for browser push manager", () => {
    expect(VAPID_PUBLIC_KEY).toBeTruthy();
    expect(VAPID_PUBLIC_KEY.length).toBeGreaterThan(30);

    const uint8Arr = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    expect(uint8Arr).toBeInstanceOf(Uint8Array);
    expect(uint8Arr.length).toBeGreaterThan(0);
  });
});


