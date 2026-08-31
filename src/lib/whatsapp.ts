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
      : "https://billease.app";

  const totalFormatted = formatCurrency(totalAmount, currency);
  const balanceFormatted = formatCurrency(balanceDue, currency);

  const previewUrl = `${baseUrl}/invoices/${invoiceId}/preview`;
  const payUrl = `${baseUrl}/pay/${invoiceId}`;

  const message = [
    `Hello *${clientName.trim()}*,`,
    ``,
    `Your invoice *#${invoiceNumber}* for *${totalFormatted}* is ready.`,
    ``,
    `*View / Download PDF Invoice:*`,
    previewUrl,
    ``,
    `*1-Click Instant Pay (GPay / PhonePe / Paytm):*`,
    payUrl,
    ``,
    `*Outstanding Balance:* ${balanceFormatted}`,
    `Thank you for your business!`,
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
