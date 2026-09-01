"use client";

import React, { useState, use, useEffect } from "react";
import { InvoiceService } from "@/services/invoice.service";
import { QuotationService } from "@/services/quotation.service";
import { supabase } from "@/lib/supabase/client";
import { Invoice, Quotation } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import {
  Smartphone,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Loader2,
  Lock,
  Building2,
  QrCode,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export default function ClientPayPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{
    businessName: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    accountName?: string;
  }>({
    businessName: "Business Studio",
    upiId: "payments@upi",
  });
  const [isLoading, setIsLoading] = useState(true);

  const [copied, setCopied] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer">("upi");
  const [isSettled, setIsSettled] = useState(false);

  // Load record and poll for live settlement updates
  useEffect(() => {
    async function loadRecord() {
      try {
        let tenantIdToFetch = "";

        const inv = await InvoiceService.getInvoiceById(id);
        if (inv) {
          setInvoice(inv);
          tenantIdToFetch = inv.tenantId || "";
          if (inv.balanceDue <= 0 || inv.status === "paid") {
            setIsSettled(true);
          }
        } else {
          const quote = await QuotationService.getQuotationById(id);
          if (quote) {
            setQuotation(quote);
            tenantIdToFetch = quote.tenantId || "";
            if (quote.status === "converted") {
              setIsSettled(true);
            }
          }
        }

        // Fetch actual tenant business profile & bank details from Supabase
        if (tenantIdToFetch) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", tenantIdToFetch)
            .single();

          if (tenantData) {
            const bank = tenantData.bank_details || {};
            setTenantInfo({
              businessName: tenantData.business_name || tenantData.name || "Business Studio",
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifscCode: bank.ifscCode,
              upiId: bank.upiId || "payments@upi",
              accountName: bank.accountName || tenantData.business_name,
            });
          }
        } else if (typeof window !== "undefined") {
          const localStr = localStorage.getItem("billease_registered_user");
          if (localStr) {
            try {
              const localParsed = JSON.parse(localStr);
              if (localParsed.businessName) {
                setTenantInfo((prev) => ({
                  ...prev,
                  businessName: localParsed.businessName,
                }));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load payment portal target:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecord();

    // Auto-poll status every 4 seconds to detect settlement in real time
    const interval = setInterval(async () => {
      try {
        const inv = await InvoiceService.getInvoiceById(id);
        if (inv && (inv.balanceDue <= 0 || inv.status === "paid")) {
          setIsSettled(true);
          setInvoice(inv);
        } else {
          const quote = await QuotationService.getQuotationById(id);
          if (quote && quote.status === "converted") {
            setIsSettled(true);
            setQuotation(quote);
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleExitSession = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
  };

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
        <div className="h-16 w-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Bill Reference Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          This payment portal link is invalid or has expired. Please contact{" "}
          <strong>{tenantInfo.businessName}</strong>.
        </p>
      </div>
    );
  }

  const isQuoteFlow = !invoice && !!quotation;
  const businessName = tenantInfo.businessName;
  const upiId = tenantInfo.upiId || "payments@upi";

  const totalBillAmount = isQuoteFlow ? quotation.totalAmount : invoice!.totalAmount;
  const payableAmount = isQuoteFlow
    ? Math.round(quotation.totalAmount * 0.5)
    : invoice!.balanceDue;

  const docNumber = isQuoteFlow ? quotation.quotationNumber : invoice!.invoiceNumber;

  // Universal UPI Intent URI with real business details
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Glows */}
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
                <span>Verified 256-Bit Encrypted Payment Portal</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment Card */}
        <div className="clay-card rounded-3xl bg-white text-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5">
          {isSettled ? (
            /* ======================================================== */
            /* SETTLED CONFIRMATION VIEW (THANK YOU ONLY)               */
            /* ======================================================== */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Payment Successful
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-3">
                  Thank You, {targetDoc.clientName}!
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your payment for #{docNumber} has been verified and settled.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Ref:</span>
                  <span className="font-bold text-slate-900">#{docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">Settled & Confirmed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-bold text-slate-900">{businessName}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Your official verified tax invoice & receipt will be delivered to you directly by{" "}
                <strong>{businessName}</strong>.
              </p>

              <button
                type="button"
                onClick={handleExitSession}
                className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            /* ======================================================== */
            /* PURE SCAN & PAY FORM VIEW (NO RISKY BUTTONS)             */
            /* ======================================================== */
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

              {/* Payment Method Switcher: UPI vs Direct Bank Transfer */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "upi"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>UPI / QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Bank Transfer</span>
                </button>
              </div>

              {paymentMethod === "upi" ? (
                /* ---------------------------------------------------- */
                /* UPI METHOD: Dynamic QR & Instant App Links           */
                /* ---------------------------------------------------- */
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Mobile Deep Links */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      1-Click UPI Payment (Tap to Open App)
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
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-purple-600">
                          PhonePe
                        </span>
                      </a>

                      <a
                        href={paytmUri}
                        className="clay-card p-3 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                      >
                        <div className="h-7 w-7 rounded-full bg-cyan-600 text-white shadow-2xs flex items-center justify-center font-black text-[10px]">
                          Py
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-cyan-600">
                          Paytm
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* QR Code Card */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-teal-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Or Scan QR Code with Any UPI App
                    </span>
                    <div className="p-2 bg-white rounded-2xl shadow-md border border-slate-200">
                      <img
                        src={getUpiQrImageUrl(upiUri)}
                        alt="Dynamic UPI QR"
                        className="h-44 w-44 object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span>UPI ID:</span>
                      <strong className="font-mono text-slate-900">{upiId}</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(upiId, "upi")}
                        className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                        title="Copy UPI ID"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {copied === "upi" && (
                        <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------------------------------------------------- */
                /* BANK TRANSFER: Real Bank Details from Settings       */
                /* ---------------------------------------------------- */
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs animate-in fade-in-50 duration-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Beneficiary Bank Details (NEFT / IMPS / RTGS)
                  </span>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Bank Name:</span>
                      <span className="font-bold text-slate-900">{tenantInfo.bankName || "HDFC Bank"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {tenantInfo.accountNumber || "919876543210"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tenantInfo.accountNumber || "", "acc")}
                          className="text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copied === "acc" && (
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">IFSC Code:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {tenantInfo.ifscCode || "HDFC0001234"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tenantInfo.ifscCode || "", "ifsc")}
                          className="text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copied === "ifsc" && (
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Account Holder:</span>
                      <span className="font-bold text-slate-900">
                        {tenantInfo.accountName || businessName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Secure Direct Settlement Note & Exit */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Once you pay via UPI or Bank Transfer, funds are credited instantly to{" "}
                    <strong>{businessName}</strong>. Your official receipt will be issued upon bank credit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExitSession}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer text-center"
                >
                  Exit / Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Direct 0% Fee Encrypted Settlement with {businessName}</span>
        </div>
      </div>
    </div>
  );
}
