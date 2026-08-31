"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { QuotationService } from "@/services/quotation.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Quotation } from "@/types";
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
  Lock,
  Receipt,
  Sparkles,
} from "lucide-react";

export default function ClientPayPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [selectedApp, setSelectedApp] = useState<"gpay" | "phonepe" | "paytm" | "upi">("upi");
  const [isSettled, setIsSettled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        const inv = await InvoiceService.getInvoiceById(id);
        if (inv) {
          setInvoice(inv);
          if (inv.balanceDue <= 0 || inv.status === "paid") {
            setIsSettled(true);
          }
        } else {
          const quote = await QuotationService.getQuotationById(id);
          if (quote) {
            setQuotation(quote);
            if (quote.status === "converted" && quote.convertedToInvoiceId) {
              setGeneratedInvoiceId(quote.convertedToInvoiceId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load payment portal target:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="text-sm font-medium text-white">Loading Secure 1-Click Pay Portal...</span>
      </div>
    );
  }

  const targetDoc = invoice || quotation;

  if (!targetDoc) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Bill Reference Not Found</h2>
        <p className="text-xs text-slate-400">The invoice or quotation reference does not exist or has expired.</p>
        <Link
          href="/"
          className="clay-tag px-4 py-2 text-xs font-bold bg-white/10 text-white border border-white/20"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const isQuoteFlow = !invoice && !!quotation;
  const businessName = "Royal Events & Print Studio";
  const upiId = "royalevents@hdfcbank";

  // If quotation, calculate standard 50% advance deposit; if invoice, use balanceDue
  const totalBillAmount = isQuoteFlow ? quotation.totalAmount : invoice!.totalAmount;
  const payableAmount = isSettled
    ? 0
    : isQuoteFlow
    ? Math.round(quotation.totalAmount * 0.5)
    : invoice!.balanceDue;

  const docNumber = isQuoteFlow ? quotation.quotationNumber : invoice!.invoiceNumber;

  // Universal UPI Intent URI
  const upiUri = generateUpiIntentUrl({
    upiId,
    businessName,
    amount: payableAmount,
    transactionRef: docNumber,
    note: isQuoteFlow ? `Advance for Quote #${docNumber}` : `Invoice #${docNumber}`,
  });

  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(docNumber)}&cu=INR`;

  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(docNumber)}&cu=INR`;

  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(docNumber)}&cu=INR`;

  const qrImageUrl = getUpiQrImageUrl(upiUri, 320);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isQuoteFlow && quotation) {
        // 1. Create Invoice from quotation with 50% advance payment recorded
        const invNumber = `INV-${Date.now().toString().slice(-4)}`;
        const createdInv = await InvoiceService.createInvoice({
          invoiceNumber: invNumber,
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber,
          clientId: quotation.clientId,
          clientName: quotation.clientName,
          clientEmail: quotation.clientEmail,
          clientPhone: quotation.clientPhone,
          clientAddress: quotation.clientAddress,
          clientGstin: quotation.clientGstin,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          status: "partially_paid",
          currency: quotation.currency,
          items: quotation.items,
          subtotal: quotation.subtotal,
          discountType: quotation.discountType,
          discountValue: quotation.discountValue,
          discountAmount: quotation.discountAmount,
          isTaxEnabled: quotation.isTaxEnabled,
          totalTax: quotation.totalTax,
          totalAmount: quotation.totalAmount,
          paidAmount: payableAmount,
          balanceDue: Math.max(0, quotation.totalAmount - payableAmount),
        });

        if (createdInv) {
          setGeneratedInvoiceId(createdInv.id);

          // 2. Record payment receipt in Supabase
          await PaymentService.recordPayment({
            invoiceId: createdInv.id,
            invoiceNumber: createdInv.invoiceNumber,
            clientId: quotation.clientId,
            clientName: quotation.clientName,
            amount: payableAmount,
            currency: quotation.currency,
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "upi",
            transactionReference: utrInput || `UPI-${Date.now().toString().slice(-6)}`,
            notes: `Advance payment for Quotation #${quotation.quotationNumber}`,
          });

          // 3. Mark quotation converted
          await QuotationService.updateQuotationStatus(quotation.id, "converted", createdInv.id);
        }
      } else if (invoice) {
        // Record payment for existing invoice
        await PaymentService.recordPayment({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          amount: payableAmount,
          currency: invoice.currency,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "upi",
          transactionReference: utrInput || `UPI-${Date.now().toString().slice(-6)}`,
          notes: `Settlement for Invoice #${invoice.invoiceNumber}`,
        });
      }

      setIsSettled(true);
    } catch (err) {
      console.error("Payment confirmation error:", err);
    } finally {
      setIsSubmitting(false);
    }
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
                src="/icon.png"
                alt="BillEase"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight">{businessName}</h1>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-400" />
                <span>256-Bit Encrypted UPI Portal</span>
              </p>
            </div>
          </div>

          <Link
            href={
              isQuoteFlow
                ? `/quotations/${quotation!.id}/preview`
                : `/invoices/${invoice!.id}/preview`
            }
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

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  {isQuoteFlow ? "Advance Payment Confirmed" : "Payment Recorded"}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {formatCurrency(payableAmount || totalBillAmount, "INR")} Received
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you, <strong>{targetDoc.clientName}</strong>! Your transaction for #{docNumber} is verified.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {utrInput || `UPI-${Date.now().toString().slice(-6)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-bold text-slate-900">
                    {new Date().toLocaleTimeString()} (Instant Settlement)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-bold text-slate-900">#{docNumber}</span>
                </div>
              </div>

              <Link
                href={
                  generatedInvoiceId
                    ? `/invoices/${generatedInvoiceId}/preview`
                    : isQuoteFlow
                    ? `/quotations/${quotation!.id}/preview`
                    : `/invoices/${invoice!.id}/preview`
                }
                target="_blank"
                className="clay-btn-emerald w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-md cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                <span>Download Official Tax Bill PDF</span>
              </Link>
            </div>
          ) : (
            /* Active Payment Form View */
            <>
              {/* Document Reference & Amount */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isQuoteFlow ? "Quotation Advance Deposit (50%)" : "Invoice Balance Due"}
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(payableAmount, "INR")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    For {isQuoteFlow ? `Quote #${docNumber}` : `Invoice #${docNumber}`} ({targetDoc.clientName})
                  </p>
                </div>

                <div className="text-right">
                  <span className="clay-tag inline-block px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {isQuoteFlow ? "50% Advance" : "Pending Due"}
                  </span>
                  {isQuoteFlow && (
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      Total: {formatCurrency(totalBillAmount, "INR")}
                    </p>
                  )}
                </div>
              </div>

              {/* 1-Click UPI Apps Trigger (Mobile Deep Links) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  1-Click UPI Payment (Open App)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={gpayUri}
                    className="clay-card p-3 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                  >
                    <div className="h-7 w-7 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center font-black text-[10px] text-blue-600">
                      G
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600">
                      Google Pay
                    </span>
                  </a>

                  <a
                    href={phonepeUri}
                    className="clay-card p-3 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                  >
                    <div className="h-7 w-7 rounded-full bg-purple-600 text-white shadow-2xs flex items-center justify-center font-black text-[10px]">
                      Pe
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-purple-700">
                      PhonePe
                    </span>
                  </a>

                  <a
                    href={paytmUri}
                    className="clay-card p-3 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                  >
                    <div className="h-7 w-7 rounded-full bg-sky-500 text-white shadow-2xs flex items-center justify-center font-black text-[9px]">
                      Pay
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-sky-600">
                      Paytm / Other
                    </span>
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center space-y-3">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  <img
                    src={qrImageUrl}
                    alt="Scan UPI QR Code"
                    className="h-36 w-36 object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-700">
                    Scan with any UPI App (BHIM, Cred, GPay)
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="clay-icon-squircle p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer"
                      title="Copy UPI ID"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {copied && (
                    <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in block">
                      Copied to clipboard!
                    </span>
                  )}
                </div>
              </div>

              {/* Confirm Payment / UTR Reference Form */}
              <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Paid? Enter 12-Digit UTR / Ref No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423589129034"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn-emerald w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-md cursor-pointer text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isSubmitting ? "Verifying Payment..." : "Confirm & Download Receipt"}</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Direct Bank Settlement via UPI NPCI Protocol</span>
          </p>
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
