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
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://billease-v1.vercel.app";

  const totalFormatted = formatCurrency(totalAmount, currency);
  const balanceFormatted = formatCurrency(balanceDue, currency);

  const previewUrl = `${baseUrl}/invoices/${invoiceId}/preview`;
  const payUrl = `${baseUrl}/pay/${invoiceId}`;

  const message = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `Your tax invoice *#${invoiceNumber}* for *${totalFormatted}* is ready.`,
    ``,
    `📄 *View / Download PDF Invoice:*`,
    previewUrl,
    ``,
    `💳 *1-Click Instant Pay (GPay / PhonePe / Paytm):*`,
    payUrl,
    ``,
    `*Balance Due:* ${balanceFormatted}`,
    `Thank you for your business!`,
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

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
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://billease-v1.vercel.app";

  const totalFormatted = formatCurrency(totalAmount, currency);
  const advance = advanceAmount || Math.round(totalAmount * 0.5);
  const advanceFormatted = formatCurrency(advance, currency);

  const previewUrl = `${baseUrl}/quotations/${quotationId}/preview`;
  const payUrl = `${baseUrl}/pay/${quotationId}`;

  const message = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `Your price quotation *#${quotationNumber}* for *${totalFormatted}* is ready.`,
    validUntil ? `*Valid Until:* ${validUntil}` : "",
    ``,
    `📄 *View / Download Estimate PDF:*`,
    previewUrl,
    ``,
    `💳 *1-Click Advance Payment (${advanceFormatted}):*`,
    payUrl,
    ``,
    `_Paying the advance will automatically issue your Tax Invoice & confirm the booking._`,
    `Thank you!`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
