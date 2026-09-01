import { formatCurrency } from "./utils";
import { CurrencyCode } from "@/types";

export interface WhatsAppInvoiceShareParams {
  clientPhone: string;
  clientName: string;
  invoiceNumber: string;
  invoiceId: string;
  totalAmount: number;
  balanceDue: number;
  currency?: CurrencyCode;
}

export interface WhatsAppQuotationShareParams {
  clientPhone: string;
  clientName: string;
  quotationNumber: string;
  quotationId: string;
  totalAmount: number;
  advanceAmount?: number;
  validUntil?: string;
  currency?: CurrencyCode;
}

export interface WhatsAppReminderParams {
  clientPhone: string;
  clientName: string;
  invoiceNumber?: string;
  invoiceId?: string;
  balanceDue: number;
  currency?: CurrencyCode;
}

export interface WhatsAppPaymentReceiptParams {
  clientPhone?: string;
  clientName: string;
  invoiceNumber?: string;
  paymentNumber: string;
  amount: number;
  currency?: CurrencyCode;
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
  totalAmount,
  balanceDue,
  currency = "INR",
}: WhatsAppInvoiceShareParams): string {
  const cleanPhone = clientPhone.replace(/[^0-9]/g, "");
  const baseUrl = getBaseUrl();
  const totalFormatted = formatCurrency(totalAmount, currency);
  const balanceFormatted = formatCurrency(balanceDue, currency);
  const payUrl = `${baseUrl}/pay/${invoiceId}`;

  const message = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `Your tax invoice *#${invoiceNumber}* for *${totalFormatted}* is ready.`,
    ``,
    `*1-Click Instant Pay (UPI / GPay / Cards):*`,
    payUrl,
    ``,
    `*Balance Due:* ${balanceFormatted}`,
    `Thank you for your business!`,
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 2. Quotation / Estimate Share
export function getWhatsAppQuotationShareUrl({
  clientPhone,
  clientName,
  quotationNumber,
  quotationId,
  totalAmount,
  advanceAmount,
  validUntil,
  currency = "INR",
}: WhatsAppQuotationShareParams): string {
  const cleanPhone = clientPhone.replace(/[^0-9]/g, "");
  const baseUrl = getBaseUrl();
  const totalFormatted = formatCurrency(totalAmount, currency);
  const advance = advanceAmount || Math.round(totalAmount * 0.5);
  const advanceFormatted = formatCurrency(advance, currency);
  const payUrl = `${baseUrl}/pay/${quotationId}`;

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `Your price quotation *#${quotationNumber}* for *${totalFormatted}* is ready.`,
  ];

  if (validUntil) {
    lines.push(`*Valid Until:* ${validUntil}`);
  }

  lines.push(
    ``,
    `*1-Click Advance Payment (${advanceFormatted}):*`,
    payUrl,
    ``,
    `_Paying the advance will automatically issue your Tax Invoice & confirm the booking._`,
    `Thank you!`
  );

  const message = lines.join("\n");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 3. Balance Due & Overdue Reminder
export function getWhatsAppReminderUrl({
  clientPhone,
  clientName,
  invoiceNumber,
  invoiceId,
  balanceDue,
  currency = "INR",
}: WhatsAppReminderParams): string {
  const cleanPhone = clientPhone.replace(/[^0-9]/g, "");
  const baseUrl = getBaseUrl();
  const balanceFormatted = formatCurrency(balanceDue, currency);

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    invoiceNumber
      ? `This is a friendly reminder regarding your outstanding balance of *${balanceFormatted}* on invoice *#${invoiceNumber}*.`
      : `This is a friendly reminder regarding your outstanding ledger balance of *${balanceFormatted}*.`,
  ];

  if (invoiceId) {
    lines.push(
      ``,
      `*1-Click Instant Settlement:*`,
      `${baseUrl}/pay/${invoiceId}`
    );
  }

  lines.push(
    ``,
    `Kindly arrange for settlement at your earliest convenience. Thank you!`
  );

  const message = lines.join("\n");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 4. Payment Receipt Acknowledgment
export function getWhatsAppPaymentReceiptUrl({
  clientPhone,
  clientName,
  invoiceNumber,
  paymentNumber,
  amount,
  currency = "INR",
}: WhatsAppPaymentReceiptParams): string {
  const cleanPhone = clientPhone ? clientPhone.replace(/[^0-9]/g, "") : "";
  const amountFormatted = formatCurrency(amount, currency);

  const lines = [
    `Hello *${clientName.trim()}*,`,
    ``,
    invoiceNumber
      ? `Payment of *${amountFormatted}* for invoice *#${invoiceNumber}* (Receipt *#${paymentNumber}*) has been received with thanks.`
      : `Payment of *${amountFormatted}* (Receipt *#${paymentNumber}*) has been recorded with thanks.`,
    ``,
    `Thank you for your business!`,
  ];

  const message = lines.join("\n");
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}
