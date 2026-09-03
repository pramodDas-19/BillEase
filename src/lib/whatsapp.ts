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

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    businessName
      ? `🧾 *TAX INVOICE #${invoiceNumber}* from *${businessName.trim()}*`
      : `🧾 *TAX INVOICE #${invoiceNumber}*`,
    `Total Amount: *${totalFormatted}*`,
    `Balance Due: *${balanceFormatted}*`,
  ];

  if (payUrl) {
    lines.push(
      ``,
      `💳 *Pay Online (UPI, GPay, PhonePe, Cards):*`,
      payUrl,
      ``,
      `_Click the link above to view your bill and settle instantly._`
    );
  }

  lines.push(
    ``,
    `Thank you for your business!`,
    businessName ? `— *${businessName.trim()}*` : ""
  );

  const message = lines.filter((line) => line !== "").join("\n");
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
  validUntil,
  currency = "INR",
  businessName,
}: WhatsAppQuotationShareParams): string {
  const cleanPhone = formatWhatsAppPhoneNumber(clientPhone);
  const baseUrl = getBaseUrl();
  const totalFormatted = formatCurrency(totalAmount, currency);
  const advance = advanceAmount || Math.round(totalAmount * 0.5);
  const advanceFormatted = formatCurrency(advance, currency);
  const payUrl = publicToken ? `${baseUrl}/pay/${publicToken}` : "";

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    businessName
      ? `📋 *PRICE QUOTATION #${quotationNumber}* from *${businessName.trim()}*`
      : `📋 *PRICE QUOTATION #${quotationNumber}*`,
    `Estimated Total: *${totalFormatted}*`,
  ];

  if (validUntil) {
    lines.push(`Valid Until: *${validUntil}*`);
  }

  if (payUrl) {
    lines.push(
      ``,
      `💳 *1-Click Advance Booking (${advanceFormatted}):*`,
      payUrl,
      ``,
      `_Paying the advance will automatically issue your Tax Invoice & confirm your booking._`
    );
  }

  lines.push(
    ``,
    `Thank you!`,
    businessName ? `— *${businessName.trim()}*` : ""
  );

  const message = lines.filter((line) => line !== "").join("\n");
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
}: WhatsAppReminderParams): string {
  const cleanPhone = formatWhatsAppPhoneNumber(clientPhone);
  const baseUrl = getBaseUrl();
  const balanceFormatted = formatCurrency(balanceDue, currency);
  const payUrl = publicToken ? `${baseUrl}/pay/${publicToken}` : "";

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    businessName
      ? `⏳ *Friendly Payment Reminder* from *${businessName.trim()}*`
      : `⏳ *Friendly Payment Reminder*`,
    invoiceNumber
      ? `Regarding outstanding balance on invoice *#${invoiceNumber}*:`
      : `Regarding your outstanding ledger balance:`,
    `Balance Due: *${balanceFormatted}*`,
  ];

  if (payUrl) {
    lines.push(
      ``,
      `💳 *1-Click Instant Settlement:*`,
      payUrl
    );
  }

  lines.push(
    ``,
    `Kindly arrange for settlement at your earliest convenience. Thank you!`,
    businessName ? `— *${businessName.trim()}*` : ""
  );

  const message = lines.filter((line) => line !== "").join("\n");
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

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `✅ *PAYMENT RECEIVED WITH THANKS*`,
    businessName ? `Received by: *${businessName.trim()}*` : "",
    `Receipt Number: *#${paymentNumber}*`,
    invoiceNumber ? `Invoice Reference: *#${invoiceNumber}*` : "",
    `Amount Paid: *${amountFormatted}*`,
    ``,
    `Thank you for your business!`,
    businessName ? `— *${businessName.trim()}*` : "",
  ];

  const message = lines.filter((line) => line !== "").join("\n");
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}
