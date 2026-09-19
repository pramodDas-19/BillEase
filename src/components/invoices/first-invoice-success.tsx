"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Invoice, Tenant } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import {
  CheckCircle2,
  Share2,
  ExternalLink,
  QrCode,
  Smartphone,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface FirstInvoiceSuccessProps {
  invoice: Invoice;
  tenant: Tenant | null;
  onClose?: () => void;
}

export function FirstInvoiceSuccess({
  invoice,
  tenant,
  onClose,
}: FirstInvoiceSuccessProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const paymentPortalUrl = `${baseUrl}/pay/${invoice.id}`;

  const businessName = tenant?.businessName || "BillEase Business";
  const upiId = tenant?.bankDetails?.upiId || "merchant@upi";

  const upiIntent = generateUpiIntentUrl({
    upiId,
    businessName,
    amount: invoice.balanceDue || invoice.totalAmount,
    transactionRef: invoice.invoiceNumber,
    note: `Invoice ${invoice.invoiceNumber}`,
  });

  const qrDataUri = getUpiQrImageUrl(upiIntent, 220);

  const handleShareWhatsApp = () => {
    const message = `Hi ${invoice.clientName},\n\nHere is your invoice *${invoice.invoiceNumber}* for *${formatCurrency(invoice.totalAmount)}* from *${businessName}*.\n\nYou can view your invoice and make payment instantly via UPI QR or bank transfer here:\n${paymentPortalUrl}\n\nThank you!`;
    const encoded = encodeURIComponent(message);
    const clientPhone = (invoice as any).clientPhone?.replace(/\D/g, "");
    const waUrl = clientPhone ? `https://wa.me/${clientPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewInvoice = () => {
    if (onClose) onClose();
    router.push("/invoices");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xl text-slate-900 my-auto animate-in zoom-in-95 duration-200">
        {/* Header Milestone */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
              Milestone Reached 🎉
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Your first invoice is ready!
            </h2>
          </div>
        </div>

        {/* Invoice Summary Pill */}
        <div className="clay-tag inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 mb-5 flex-wrap">
          <span className="font-mono text-slate-900">{invoice.invoiceNumber}</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-700 font-extrabold">{formatCurrency(invoice.totalAmount)}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{invoice.clientName}</span>
        </div>

        {/* Embedded Client Portal Live Preview */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-5 mb-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Live Client Payment Portal Preview</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md">
              What your client sees
            </span>
          </div>

          {/* Mini Branded Card */}
          <div className="clay-card rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
            {/* Dynamic QR Code */}
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
              <img
                src={qrDataUri}
                alt={`UPI QR for ${invoice.invoiceNumber}`}
                className="w-32 h-32 object-contain"
              />
              <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase mt-1">
                Scan with any UPI App
              </span>
            </div>

            {/* Portal Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Payment Due to</span>
                <span className="font-black text-slate-900 text-base">{businessName}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Amount to Pay</span>
                <span className="font-black text-2xl text-emerald-700 font-mono">
                  {formatCurrency(invoice.balanceDue || invoice.totalAmount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                VPA: <span className="font-mono font-bold text-slate-800">{upiId}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 font-medium mt-3 text-center sm:text-left">
            💡 When you send the link, your client can pay directly with <strong>GPay, PhonePe, Paytm, or Bank Transfer</strong> without creating an account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? "Payment Link Copied!" : "Copy Payment Link"}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleViewInvoice}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:translate-y-[1px]"
            >
              View Invoices
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="clay-btn-emerald flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
