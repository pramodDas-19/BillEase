import { formatCurrency } from "./utils";
import { CurrencyCode } from "@/types";

export interface WhatsAppInvoiceShareParams {
  clientPhone: string;
  clientName: string;
  invoiceNumber: string;
  invoiceId: string;
  publicToken?: string;
  totalAmount: number;
  balanceDue: number;
  currency?: CurrencyCode;
  businessName?: string;
}

export interface WhatsAppQuotationShareParams {
  clientPhone: string;
  clientName: string;
  quotationNumber: string;
  quotationId: string;
  publicToken?: string;
  totalAmount: number;
  advanceAmount?: number;
  advancePercentage?: number;
  advanceType?: "percentage" | "fixed" | "none";
  validUntil?: string;
  currency?: CurrencyCode;
  businessName?: string;
}

export interface WhatsAppReminderParams {
  clientPhone: string;
  clientName: string;
  invoiceNumber?: string;
  invoiceId?: string;
  publicToken?: string;
  balanceDue: number;
  currency?: CurrencyCode;
  businessName?: string;
  customTemplate?: string;
}

export interface WhatsAppPaymentReceiptParams {
  clientPhone?: string;
  clientName: string;
  invoiceNumber?: string;
  paymentNumber: string;
  amount: number;
  currency?: CurrencyCode;
  businessName?: string;
}

/**
 * Normalizes phone numbers to standard WhatsApp E.164 international format.
 * In India, users frequently enter 10-digit mobile numbers (e.g. 9876543210 or 09876543210).
 * This ensures they are prefixed with '91' so the wa.me link opens properly without invalid number errors.
 */
export function formatWhatsAppPhoneNumber(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  if (!clean) return "";

  // 10 digits starting with 6, 7, 8, or 9 -> Indian mobile number
  if (clean.length === 10 && /^[6-9]/.test(clean)) {
    return `91${clean}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210) -> Strip leading 0 and add 91
  if (clean.length === 11 && clean.startsWith("0") && /^[6-9]/.test(clean.substring(1))) {
    return `91${clean.substring(1)}`;
  }

  // Otherwise return cleaned number
  return clean;
}

const getBaseUrl = () => {
  return typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://billease-v1.vercel.app";
};

// 1. Tax Invoice Share
export function getWhatsAppInvoiceShareUrl({
  clientPhone,
  clientName,
  invoiceNumber,
  invoiceId,
  publicToken,
  totalAmount,
  balanceDue,
  currency = "INR",
  businessName,
}: WhatsAppInvoiceShareParams): string {
  const cleanPhone = formatWhatsAppPhoneNumber(clientPhone);
  const baseUrl = getBaseUrl();
  const totalFormatted = formatCurrency(totalAmount, currency);
  const balanceFormatted = formatCurrency(balanceDue, currency);
  const payUrl = publicToken ? `${baseUrl}/pay/${publicToken}` : "";
  const senderBrand = businessName?.trim() ? businessName.trim() : "Our Team";

  const blocks: string[] = [
    `Hello *${clientName.trim()}*,`,
    [
      `🧾 *TAX INVOICE #${invoiceNumber}* from *${senderBrand}*`,
      `Total Amount: *${totalFormatted}*`,
      `Balance Due: *${balanceFormatted}*`,
    ].join("\n"),
  ];

  if (payUrl) {
    blocks.push(
      [
        `💳 *Pay Online (UPI, GPay, PhonePe, Cards):*`,
        payUrl,
        `_Click the link above to view your bill and settle instantly._`,
      ].join("\n")
    );
  }

  blocks.push(
    [
      `Thank you for your business!`,
      `— *${senderBrand}*`,
    ].join("\n")
  );

  const message = blocks.join("\n\n");
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// 2. Quotation / Estimate Share
export function getWhatsAppQuotationShareUrl({
  clientPhone,
  clientName,
  quotationNumber,
  quotationId,
  publicToken,
  totalAmount,
  advanceAmount,
  advancePercentage,
  advanceType,
  validUntil,
  currency = "INR",
  businessName,
}: WhatsAppQuotationShareParams): string {
  const cleanPhone = formatWhatsAppPhoneNumber(clientPhone);
  const baseUrl = getBaseUrl();
  const totalFormatted = formatCurrency(totalAmount, currency);
  const payUrl = publicToken ? `${baseUrl}/pay/${publicToken}` : "";
  const senderBrand = businessName?.trim() ? businessName.trim() : "Our Team";

  // Advance determination
  const hasAdvance = advanceType !== "none" && (advanceAmount !== undefined ? advanceAmount > 0 : true);
  const calculatedAdvance = advanceAmount !== undefined
    ? advanceAmount
    : Math.round(totalAmount * 0.5);
  const advanceFormatted = formatCurrency(calculatedAdvance, currency);

  let percentLabel = "";
  if (advancePercentage !== undefined && advancePercentage > 0) {
    percentLabel = `${advancePercentage}%`;
  } else if (advanceType === "percentage" || advanceAmount === undefined) {
    const calcPct = Math.round((calculatedAdvance / (totalAmount || 1)) * 100);
    percentLabel = `${calcPct}%`;
  }

  const detailsLines = [
    `📋 *PRICE QUOTATION #${quotationNumber}* from *${senderBrand}*`,
    `Estimated Total: *${totalFormatted}*`,
  ];

  if (hasAdvance && calculatedAdvance > 0) {
    detailsLines.push(
      percentLabel
        ? `Booking Advance (${percentLabel}): *${advanceFormatted}*`
        : `Booking Advance: *${advanceFormatted}*`
    );
  }

  if (validUntil) {
    detailsLines.push(`Valid Until: *${validUntil}*`);
  }

  const blocks: string[] = [
    `Hello *${clientName.trim()}*,`,
    detailsLines.join("\n"),
  ];

  if (payUrl) {
    blocks.push(
      [
        `💳 *View Quotation & Confirm Booking:*`,
        payUrl,
        hasAdvance && calculatedAdvance > 0
          ? `_Click the link above to review quotation & pay the ${advanceFormatted} advance to confirm your order._`
          : `_Click the link above to review your quotation and confirm your order._`,
      ].join("\n")
    );
  }

  blocks.push(
    [
      `Thank you!`,
      `— *${senderBrand}*`,
    ].join("\n")
  );

  const message = blocks.join("\n\n");
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// 3. Balance Due & Overdue Reminder
export function getWhatsAppReminderUrl({
  clientPhone,
  clientName,
  invoiceNumber,
  invoiceId,
  publicToken,
  balanceDue,
  currency = "INR",
  businessName,
  customTemplate,
}: WhatsAppReminderParams): string {
  const cleanPhone = formatWhatsAppPhoneNumber(clientPhone);
  const baseUrl = getBaseUrl();
  const balanceFormatted = formatCurrency(balanceDue, currency);
  const payUrl = publicToken ? `${baseUrl}/pay/${publicToken}` : "";
  const senderBrand = businessName?.trim() ? businessName.trim() : "Our Team";

  let message = "";
  if (customTemplate && customTemplate.trim()) {
    message = customTemplate
      .replace(/\{client_name\}/gi, clientName.trim())
      .replace(/\{business_name\}/gi, senderBrand)
      .replace(/\{invoice_num\}/gi, invoiceNumber ? `${invoiceNumber}` : "")
      .replace(/\{balance_due\}/gi, balanceFormatted)
      .replace(/\{pay_link\}/gi, payUrl || "");

    if (payUrl && !customTemplate.includes("{pay_link}")) {
      message += `\n\n💳 1-Click Pay: ${payUrl}`;
    }
  } else {
    const blocks: string[] = [
      `Hello *${clientName.trim()}*,`,
      [
        `⏳ *Friendly Payment Reminder* from *${senderBrand}*`,
        invoiceNumber
          ? `Regarding outstanding balance on invoice *#${invoiceNumber}*:`
          : `Regarding your outstanding ledger balance:`,
        `Balance Due: *${balanceFormatted}*`,
      ].join("\n"),
    ];

    if (payUrl) {
      blocks.push(
        [
          `💳 *1-Click Instant Settlement:*`,
          payUrl,
        ].join("\n")
      );
    }

    blocks.push(
      [
        `Kindly arrange for settlement at your earliest convenience. Thank you!`,
        `— *${senderBrand}*`,
      ].join("\n")
    );

    message = blocks.join("\n\n");
  }

  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// 4. Payment Receipt Acknowledgment
export function getWhatsAppPaymentReceiptUrl({
  clientPhone,
  clientName,
  invoiceNumber,
  paymentNumber,
  amount,
  currency = "INR",
  businessName,
}: WhatsAppPaymentReceiptParams): string {
  const cleanPhone = clientPhone ? formatWhatsAppPhoneNumber(clientPhone) : "";
  const amountFormatted = formatCurrency(amount, currency);
  const senderBrand = businessName?.trim() ? businessName.trim() : "Our Team";

  const detailsLines = [
    `✅ *PAYMENT RECEIVED WITH THANKS*`,
    `Received by: *${senderBrand}*`,
    `Receipt Number: *#${paymentNumber}*`,
  ];

  if (invoiceNumber) {
    detailsLines.push(`Invoice Reference: *#${invoiceNumber}*`);
  }

  detailsLines.push(`Amount Paid: *${amountFormatted}*`);

  const blocks: string[] = [
    `Hello *${clientName.trim()}*,`,
    detailsLines.join("\n"),
    [
      `Thank you for your business!`,
      `— *${senderBrand}*`,
    ].join("\n"),
  ];

  const message = blocks.join("\n\n");
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}
