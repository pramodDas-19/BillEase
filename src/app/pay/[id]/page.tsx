"use client";

import React, { useState, use, useEffect } from "react";
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
} from "lucide-react";

interface PublicPaymentPayload {
  id: string;
  invoiceNumber: string;
  isQuotation: boolean;
  clientName: string;
  totalAmount: number;
  advanceAmount?: number;
  advanceType?: string;
  balanceDue: number;
  paidAmount: number;
  status: string;
  currency: string;
  dueDate: string | null;
  businessName: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    accountName: string;
  };
}

export default function ClientPayPortalPage({
  params,
}: {
  params: Promise<{ id?: string; token?: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token || resolvedParams.id || "";

  const [paymentData, setPaymentData] = useState<PublicPaymentPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer">("upi");
  const [isSettled, setIsSettled] = useState(false);

  // 1. Initial Load: Fetch payment details from secure server endpoint
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function loadPaymentDetails() {
      try {
        const res = await fetch(`/api/public/invoice/${encodeURIComponent(token)}`);
        if (!res.ok) {
          if (isMounted) setIsError(true);
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          if (isMounted) {
            setPaymentData(json.data);
            if (
              json.data.balanceDue <= 0 ||
              json.data.status === "paid" ||
              json.data.status === "converted"
            ) {
              setIsSettled(true);
            }
          }
        } else {
          if (isMounted) setIsError(true);
        }
      } catch (err) {
        console.error("Failed to load invoice payment portal:", err);
        if (isMounted) setIsError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPaymentDetails();

    // 2. Real-time Settlement Auto-Polling: poll status route every 4 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/invoice/${encodeURIComponent(token)}/status`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (
              json.balanceDue <= 0 ||
              json.status === "paid" ||
              json.status === "converted"
            ) {
              setIsSettled(true);
            }
            setPaymentData((prev) =>
              prev
                ? {
                    ...prev,
                    balanceDue: json.balanceDue,
                    paidAmount: json.paidAmount,
                    status: json.status,
                  }
                : null
            );
          }
        }
      } catch {}
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

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

  if (isError || !paymentData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Bill Reference Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          This payment portal link is invalid or has expired. Please contact the business owner for an updated link.
        </p>
      </div>
    );
  }

  const {
    invoiceNumber,
    isQuotation,
    clientName,
    totalAmount,
    balanceDue,
    businessName,
    bankDetails,
  } = paymentData;

  const payableAmount = isQuotation
    ? (paymentData.advanceAmount !== undefined
        ? (paymentData.advanceAmount === 0 || paymentData.advanceType === "none" ? totalAmount : paymentData.advanceAmount)
        : Math.round(totalAmount * 0.5))
    : balanceDue;
  const upiId = bankDetails?.upiId || "payments@upi";

  // Universal UPI Intent URI
  const upiUri = generateUpiIntentUrl({
    upiId,
    businessName,
    amount: payableAmount,
    transactionRef: invoiceNumber,
    note: isQuotation ? `Advance for Quote #${invoiceNumber}` : `Invoice #${invoiceNumber}`,
  });

  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(invoiceNumber)}&cu=INR`;

  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(invoiceNumber)}&cu=INR`;

  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    businessName
  )}&am=${payableAmount}&tr=${encodeURIComponent(invoiceNumber)}&cu=INR`;

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
                  Thank You, {clientName}!
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your payment for #{invoiceNumber} has been verified and settled.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Ref:</span>
                  <span className="font-bold text-slate-900">#{invoiceNumber}</span>
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
                    {isQuotation
                      ? (paymentData.advanceAmount === 0 || paymentData.advanceType === "none"
                          ? "Quotation Settlement"
                          : `Quotation Booking Advance (${
                              paymentData.advanceAmount && totalAmount > 0
                                ? `${Math.round((paymentData.advanceAmount / totalAmount) * 100)}%`
                                : "50%"
                            })`)
                      : "Invoice Balance Due"}
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(payableAmount, "INR")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    For {isQuotation ? `Quote #${invoiceNumber}` : `Invoice #${invoiceNumber}`} ({clientName})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Billed</span>
                  <span className="text-sm font-extrabold text-slate-600">
                    {formatCurrency(totalAmount, "INR")}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === "upi"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Instant UPI QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === "bank_transfer"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Bank Transfer</span>
                </button>
              </div>

              {/* TAB 1: Instant UPI QR View */}
              {paymentMethod === "upi" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Dynamic High-Res QR Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500/40 shadow-md">
                      <img
                        src={getUpiQrImageUrl(upiUri)}
                        alt="UPI QR Code"
                        className="h-44 w-44 object-contain rounded-lg"
                      />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-800">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UPI ID: <span className="text-slate-700 font-semibold">{upiId}</span>
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Mobile Apps Launch Links */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
                      Or Open Directly on Your Mobile App
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={gpayUri}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Smartphone className="h-4 w-4 text-emerald-600" />
                        <span>GPay</span>
                      </a>
                      <a
                        href={phonepeUri}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span>PhonePe</span>
                      </a>
                      <a
                        href={paytmUri}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Smartphone className="h-4 w-4 text-cyan-600" />
                        <span>Paytm</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Direct Bank Transfer Details */}
              {paymentMethod === "bank_transfer" && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Beneficiary Name</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{bankDetails?.accountName || businessName}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bankDetails?.accountName || businessName, "name")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Bank Name</span>
                    <span className="font-bold text-slate-900">{bankDetails?.bankName || "HDFC Bank"}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Account Number</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{bankDetails?.accountNumber || "Not configured"}</span>
                      {bankDetails?.accountNumber && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankDetails.accountNumber, "acc")}
                          className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">IFSC Code</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{bankDetails?.ifscCode || "Not configured"}</span>
                      {bankDetails?.ifscCode && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankDetails.ifscCode, "ifsc")}
                          className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">UPI ID</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                      <span>{upiId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(upiId, "upi")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {copied && (
                    <div className="text-center pt-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Copied to clipboard!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Radar Status indicator */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-semibold text-slate-600">Waiting for transaction...</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Auto-detects live</span>
              </div>
            </>
          )}
        </div>

        {/* Security & Verification Footer */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Direct Payment to {businessName}</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Powered by BillEase Payment Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
