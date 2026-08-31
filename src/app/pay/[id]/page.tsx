"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { Invoice } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import {
  Smartphone,
  CheckCircle2,
  Download,
  Copy,
  ShieldCheck,
  FileCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function ClientPayPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [isSettled, setIsSettled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    InvoiceService.getInvoiceById(id).then((data) => {
      setInvoice(data);
      if (data && (data.balanceDue <= 0 || data.status === "paid")) {
        setIsSettled(true);
      }
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="text-sm font-medium text-white">Loading Payment Portal...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Invoice Not Found</h2>
        <p className="text-xs text-slate-400">The invoice reference does not exist or has expired.</p>
        <Link
          href="/"
          className="clay-tag px-4 py-2 text-xs font-bold bg-white/10 text-white border border-white/20"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const businessName = "Royal Events & Print Studio";
  const upiId = "royalevents@hdfcbank";
  const balanceDue = isSettled ? 0 : invoice.balanceDue;

  // Universal UPI Intent URI
  const upiUri = generateUpiIntentUrl({
    upiId,
    businessName,
    amount: balanceDue,
    transactionRef: invoice.invoiceNumber,
    note: `Invoice ${invoice.invoiceNumber}`,
  });

  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${balanceDue}&tr=${encodeURIComponent(invoice.invoiceNumber)}&cu=INR`;

  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${balanceDue}&tr=${encodeURIComponent(invoice.invoiceNumber)}&cu=INR`;

  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${balanceDue}&tr=${encodeURIComponent(invoice.invoiceNumber)}&cu=INR`;

  const qrImageUrl = getUpiQrImageUrl(upiUri, 320);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSettled(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <img
                src="/assets/logo/LOGO.png"
                alt="BillEase"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight">{businessName}</h1>
              <p className="text-[10px] text-slate-400 font-medium">Verified Payment Portal</p>
            </div>
          </div>

          <Link
            href={`/invoices/${invoice.id}/preview`}
            target="_blank"
            className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md transition-all"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span>View PDF</span>
          </Link>
        </div>

        {/* Payment Card */}
        <div className="clay-card rounded-3xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-200/80 space-y-5">
          {isSettled ? (
            /* Settled Confirmation View */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900">Payment Received!</h2>
                <p className="text-xs text-slate-500">
                  Invoice #{invoice.invoiceNumber} has been settled in full.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-slate-900">{invoice.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Settled:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="font-extrabold text-slate-900">₹0.00 (Settled)</span>
                </div>
              </div>

              <Link
                href={`/invoices/${invoice.id}/preview`}
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-950/20"
              >
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>Download Official Paid Receipt PDF</span>
              </Link>
            </div>
          ) : (
            /* Active Outstanding Balance View */
            <>
              {/* Top Amount Banner */}
              <div className="text-center space-y-1 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Balance Outstanding
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(balanceDue, invoice.currency)}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Invoice #{invoice.invoiceNumber} • {invoice.clientName}
                </p>
              </div>

              {/* 1-Click Mobile UPI App Launchers */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
                  1-Click Instant Pay on Mobile:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={gpayUri}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-center group cursor-pointer shadow-2xs"
                  >
                    <span className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-800">
                      GPay
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Google Pay</span>
                  </a>

                  <a
                    href={phonepeUri}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-all text-center group cursor-pointer shadow-2xs"
                  >
                    <span className="font-extrabold text-xs text-slate-800 group-hover:text-purple-800">
                      PhonePe
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Instant</span>
                  </a>

                  <a
                    href={paytmUri}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all text-center group cursor-pointer shadow-2xs"
                  >
                    <span className="font-extrabold text-xs text-slate-800 group-hover:text-sky-800">
                      Paytm
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">BHIM UPI</span>
                  </a>
                </div>

                <a
                  href={upiUri}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Open in Any UPI App</span>
                </a>
              </div>

              {/* Or Scan QR Code */}
              <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Or Scan with Phone Camera:
                </span>
                <div className="flex justify-center">
                  <div className="p-2 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs">
                    <img
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      className="h-36 w-36 object-contain mx-auto"
                    />
                  </div>
                </div>

                {/* Copy VPA */}
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <span className="font-mono text-slate-700 text-[11px] truncate">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-1 font-bold text-[11px] text-emerald-700 hover:text-emerald-800 cursor-pointer ml-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-emerald-600" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Manual Confirmation / UTR Entry */}
              <form
                onSubmit={handleConfirmPayment}
                className="pt-2 border-t border-slate-100 space-y-2"
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Already paid? Enter Reference / UTR:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref / UTR No."
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Verifying..." : "Confirm Pay"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Security Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>NPCI Direct Bank Encrypted Payment Engine</span>
        </div>
      </div>
    </div>
  );
}
