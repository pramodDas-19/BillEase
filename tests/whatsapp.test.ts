import { describe, it, expect } from "vitest";
import {
  formatWhatsAppPhoneNumber,
  getWhatsAppInvoiceShareUrl,
  getWhatsAppQuotationShareUrl,
  getWhatsAppPaymentReceiptUrl,
} from "../src/lib/whatsapp";

describe("WhatsApp Sharing & Phone Normalization Engine", () => {
  describe("formatWhatsAppPhoneNumber", () => {
    it("prefixes 10-digit Indian mobile numbers with 91", () => {
      expect(formatWhatsAppPhoneNumber("9820122334")).toBe("919820122334");
      expect(formatWhatsAppPhoneNumber("7001234567")).toBe("917001234567");
      expect(formatWhatsAppPhoneNumber("8888899999")).toBe("918888899999");
    });

    it("strips leading 0 from 11-digit numbers and prefixes with 91", () => {
      expect(formatWhatsAppPhoneNumber("09820122334")).toBe("919820122334");
    });

    it("strips special characters, spaces, and formatting brackets", () => {
      expect(formatWhatsAppPhoneNumber("+91 98201-22334")).toBe("919820122334");
      expect(formatWhatsAppPhoneNumber("(+91) 98201 22334")).toBe("919820122334");
    });

    it("handles empty or falsy inputs gracefully", () => {
      expect(formatWhatsAppPhoneNumber("")).toBe("");
      expect(formatWhatsAppPhoneNumber("   ")).toBe("");
    });
  });

  describe("getWhatsAppInvoiceShareUrl", () => {
    it("generates a valid wa.me link with encoded tax invoice details", () => {
      const url = getWhatsAppInvoiceShareUrl({
        clientPhone: "9820122334",
        clientName: "Rahul Sharma",
        invoiceNumber: "INV-1001",
        invoiceId: "inv-123",
        publicToken: "token-abc-xyz",
        totalAmount: 50000,
        balanceDue: 25000,
        businessName: "Royal Events & Prints",
      });

      expect(url).toContain("https://wa.me/919820122334?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Rahul Sharma");
      expect(decoded).toContain("TAX INVOICE #INV-1001");
      expect(decoded).toContain("Royal Events & Prints");
      expect(decoded).toContain("/pay/token-abc-xyz");
      expect(decoded).toContain("₹ 50,000.00");
      expect(decoded).toContain("₹ 25,000.00");
    });
  });

  describe("getWhatsAppPaymentReceiptUrl", () => {
    it("generates a valid payment acknowledgement link", () => {
      const url = getWhatsAppPaymentReceiptUrl({
        clientPhone: "9820122334",
        clientName: "Pooja Verma",
        paymentNumber: "PAY-2001",
        invoiceNumber: "INV-1001",
        amount: 15000,
        businessName: "Royal Events",
      });

      expect(url).toContain("https://wa.me/919820122334?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Pooja Verma");
      expect(decoded).toContain("#PAY-2001");
      expect(decoded).toContain("₹ 15,000.00");
      expect(decoded).toContain("Royal Events");
    });
  });

  describe("getWhatsAppQuotationShareUrl", () => {
    it("generates a valid estimate share link with advance terms", () => {
      const url = getWhatsAppQuotationShareUrl({
        clientPhone: "9820122334",
        clientName: "Acme Corp",
        quotationNumber: "QT-500",
        quotationId: "qt-500",
        publicToken: "token-qt-500",
        totalAmount: 120000,
        advanceType: "percentage",
        advancePercentage: 50,
        businessName: "Royal Events",
      });

      expect(url).toContain("https://wa.me/919820122334?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Acme Corp");
      expect(decoded).toContain("QUOTATION #QT-500");
      expect(decoded).toContain("50%");
      expect(decoded).toContain("Royal Events");
    });
  });
});
