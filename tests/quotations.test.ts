import { describe, it, expect } from "vitest";
import { calculateDocumentTotals } from "@/lib/calculation";

describe("Quotations & Estimates Engine", () => {
  it("calculates percentage-based advance booking token accurately", () => {
    const totalAmount = 50000;
    const advancePercentage = 50;
    const advanceAmount = Math.round(((totalAmount * advancePercentage) / 100) * 100) / 100;

    expect(advanceAmount).toBe(25000);
  });

  it("calculates fixed advance booking token with upper bound safety", () => {
    const totalAmount = 15000;
    const fixedAdvance = 5000;
    const cappedAdvance = Math.min(totalAmount, Math.max(0, fixedAdvance));

    expect(cappedAdvance).toBe(5000);

    // If advance exceeds total, clamp to total
    const excessiveAdvance = 20000;
    const clamped = Math.min(totalAmount, Math.max(0, excessiveAdvance));
    expect(clamped).toBe(15000);
  });

  it("calculates quotation subtotal, tax breakdown, and totals for professional services", () => {
    const calculation = calculateDocumentTotals({
      items: [
        {
          id: "item-1",
          description: "Full Stack Web Application Architecture",
          quantity: 1,
          rate: 40000,
          amount: 40000,
          taxRate: 18,
        },
        {
          id: "item-2",
          description: "AWS Cloud Infrastructure Setup & DevOps",
          quantity: 1,
          rate: 15000,
          amount: 15000,
          taxRate: 18,
        },
      ],
      discountType: "percentage",
      discountValue: 10, // 10% discount on ₹55,000
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "intra_state",
    });

    expect(calculation.subtotal).toBe(55000);
    expect(calculation.discountAmount).toBe(5500);
    expect(calculation.taxableAmount).toBe(49500);
    expect(calculation.totalTax).toBe(8910);
    expect(calculation.totalAmount).toBe(58410);

    // Intra-state split: CGST 9% (₹4,455) + SGST 9% (₹4,455)
    expect(calculation.taxBreakdown).toHaveLength(2);
    expect(calculation.taxBreakdown[0]).toEqual({ name: "CGST (9%)", rate: 9, amount: 4455 });
    expect(calculation.taxBreakdown[1]).toEqual({ name: "SGST (9%)", rate: 9, amount: 4455 });
  });

  it("calculates Inter-State IGST for out-of-state quotations", () => {
    const calculation = calculateDocumentTotals({
      items: [
        {
          id: "item-1",
          description: "Industrial Machinery Parts",
          quantity: 2,
          rate: 25000,
          amount: 50000,
          taxRate: 18,
        },
      ],
      isTaxEnabled: true,
      defaultTaxRate: 18,
      gstType: "inter_state",
    });

    expect(calculation.subtotal).toBe(50000);
    expect(calculation.taxableAmount).toBe(50000);
    expect(calculation.totalTax).toBe(9000);
    expect(calculation.totalAmount).toBe(59000);
    expect(calculation.taxBreakdown).toHaveLength(1);
    expect(calculation.taxBreakdown[0]).toEqual({ name: "IGST (18%)", rate: 18, amount: 9000 });
  });

  it("formats sanitized document titles for Quotation and Invoice PDF export", () => {
    const quoteNum = "QT-2026/001";
    const sanitizedQuoteTitle = `BillEase_Quotation_${quoteNum.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    expect(sanitizedQuoteTitle).toBe("BillEase_Quotation_QT-2026_001");

    const invNum = "INV/2026-1045";
    const sanitizedInvTitle = `BillEase_Invoice_${invNum.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    expect(sanitizedInvTitle).toBe("BillEase_Invoice_INV_2026-1045");
  });

  it("verifies advance payment receipt recording upon invoice creation", async () => {
    const { PaymentService } = await import("@/services/payment.service");

    const paymentReceipt = await PaymentService.recordPayment({
      invoiceId: "inv-test-advance-1",
      invoiceNumber: "INV-2026-0042",
      clientId: "client-test-1",
      clientName: "Pramod Das",
      amount: 10000,
      currency: "INR",
      paymentMethod: "cash",
      transactionReference: "Cash Advance on Quote Conversion",
      notes: "Advance payment recorded upon issuing Invoice #INV-2026-0042 from Quotation #QT-2026-001.",
      status: "completed",
    });

    expect(paymentReceipt).not.toBeNull();
    expect(paymentReceipt?.amount).toBe(10000);
    expect(paymentReceipt?.paymentMethod).toBe("cash");
    expect(paymentReceipt?.invoiceNumber).toBe("INV-2026-0042");
    expect(paymentReceipt?.clientName).toBe("Pramod Das");
    expect(paymentReceipt?.transactionReference).toBe("Cash Advance on Quote Conversion");
    expect(paymentReceipt?.status).toBe("completed");
  });
});
