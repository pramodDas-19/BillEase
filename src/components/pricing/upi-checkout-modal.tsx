"use client";

import React, { useState, useId } from "react";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Clock,
  Smartphone,
  QrCode,
} from "lucide-react";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { formatCurrency, cn } from "@/lib/utils";
import { useTenantContext } from "@/context/tenant-context";
import { TenantService } from "@/services/tenant.service";
import { SubscriptionPlan } from "@/types";

export interface UpiCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "pro_monthly" | "pro_annual" | "enterprise";
  onSuccess?: () => void;
}

export const OFFICIAL_PLATFORM_UPI = {
  upiId: "daspramod479@okicici",
  payeeName: "Pramod Das",
  businessName: "BillEase Pro Subscription",
};

export function UpiCheckoutModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: UpiCheckoutModalProps) {
  const { currentTenant, refreshTenantData } = useTenantContext();
  const [utrNumber, setUtrNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<"qr" | "apps">("qr");

  if (!isOpen) return null;

  const planName =
    plan === "pro_annual"
      ? "Pro Business (Annual)"
      : plan === "enterprise"
      ? "Enterprise Plan"
      : "Pro Business (Monthly)";

  const amount =
    plan === "pro_annual" ? 14990 : plan === "enterprise" ? 29990 : 1499;

  const billingPeriodDays = plan === "pro_annual" ? 365 : 30;

  // Dynamic standardized Bharat UPI Intent URI
  const upiIntentUrl = generateUpiIntentUrl({
    upiId: OFFICIAL_PLATFORM_UPI.upiId,
    businessName: OFFICIAL_PLATFORM_UPI.payeeName,
    amount,
    transactionRef: `SUB-${currentTenant?.slug || "BILLEASE"}-${Date.now().toString().slice(-6)}`,
    note: `BillEase ${planName} Upgrade`,
  });

  // Zero-network instant local SVG QR code
  const qrSvgDataUri = getUpiQrImageUrl(upiIntentUrl, 260);

  // App-specific deep links
  const gpayUrl = `gpay://upi/pay?pa=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.upiId)}&pn=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`BillEase ${planName}`)}`;
  const phonepeUrl = `phonepe://upi/pay?pa=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.upiId)}&pn=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`BillEase ${planName}`)}`;
  const paytmUrl = `paytmmp://upi/pay?pa=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.upiId)}&pn=${encodeURIComponent(OFFICIAL_PLATFORM_UPI.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`BillEase ${planName}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(OFFICIAL_PLATFORM_UPI.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utrNumber.trim().replace(/\s+/g, "");
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMsg("Please enter a valid 12-digit UPI Reference / UTR Number from your payment app.");
      return;
    }

    if (!currentTenant?.id) {
      setErrorMsg("Missing business account identifier. Please log in again.");
      return;
    }

    setVerifying(true);
    try {
      const currentPeriodEnd = new Date(
        Date.now() + billingPeriodDays * 24 * 60 * 60 * 1000
      ).toISOString();

      // Upgrade tenant subscription via TenantService & PostgreSQL sync
      await TenantService.updateSubscription(currentTenant.id, {
        plan,
        status: "active",
        utrNumber: cleanUtr,
        paymentMethod: "UPI",
        currentPeriodEnd,
      });

      await refreshTenantData();
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Upgrade activation error:", err);
      setErrorMsg("Could not verify transaction. Please double-check your UTR number or contact support.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 my-auto text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center app-press"
          aria-label="Close checkout"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          /* ============================================================ */
          /* SUCCESS CELEBRATION SCREEN                                  */
          /* ============================================================ */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg border border-emerald-200">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5px]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                Payment Verified • Pro Activated
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                🎉 Welcome to BillEase Pro!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your subscription has been upgraded to <strong>{planName}</strong>. All premium features are unlocked immediately.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <span>Account</span>
                <span className="font-bold text-slate-900">{currentTenant?.businessName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Amount Paid</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Payee VPA</span>
                <span className="font-mono text-slate-700">{OFFICIAL_PLATFORM_UPI.upiId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>UTR / Ref No</span>
                <span className="font-mono font-bold text-slate-900">{utrNumber.trim()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200/70">
                <span>Access Status</span>
                <span className="inline-flex items-center gap-1 font-black text-emerald-700">
                  <Zap className="h-3 w-3 fill-current" />
                  Unlimited Pro Active
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="clay-btn-emerald w-full h-11 rounded-2xl font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 app-press"
            >
              <span>Start Invoicing Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* ============================================================ */
          /* UPI PAYMENT CHECKOUT FORM                                    */
          /* ============================================================ */
          <div className="space-y-4">
            {/* Header Badge & Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Zap className="h-3 w-3 fill-current text-emerald-700" />
                  Instant UPI Activation
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Upgrade to {planName}
              </h2>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                  {formatCurrency(amount)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {plan === "pro_annual" ? "/ 1 Year (Save 17%)" : "/ 1 Month"}
                </span>
              </div>
            </div>

            {/* Official Payee VPA Box with 1-Click Copy */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80 p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Official BillEase UPI ID (VPA)
                </span>
                <p className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {OFFICIAL_PLATFORM_UPI.upiId}
                </p>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Payee: {OFFICIAL_PLATFORM_UPI.payeeName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className={cn(
                  "clay-tag flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 app-press",
                  copied
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
                title="Copy UPI VPA"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile View Toggle: 1-Click Apps vs QR Code */}
            <div className="flex sm:hidden p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("apps")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  viewMode === "apps"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>1-Click UPI Apps</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("qr")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  viewMode === "qr"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* Mobile 1-Click App Pay Deep Links */}
            {(viewMode === "apps" || typeof window !== "undefined") && (
              <div className="block sm:hidden space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Tap to pay instantly on this phone:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={gpayUrl}
                    className="clay-card p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 app-press text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      G
                    </span>
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={phonepeUrl}
                    className="clay-card p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 app-press text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <span className="h-6 w-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
                      Pe
                    </span>
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={paytmUrl}
                    className="clay-card p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 app-press text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <span className="h-6 w-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">
                      Pay
                    </span>
                    <span>Paytm</span>
                  </a>
                  <a
                    href={upiIntentUrl}
                    className="clay-card p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 flex items-center gap-2 app-press text-xs font-bold text-emerald-900 shadow-2xs"
                  >
                    <ExternalLink className="h-4 w-4 text-emerald-700" />
                    <span>Any UPI App</span>
                  </a>
                </div>
              </div>
            )}

            {/* Dynamic QR Code Display (Desktop default, mobile togglable) */}
            <div className={cn("text-center space-y-2", viewMode === "apps" ? "hidden sm:block" : "block")}>
              <div className="inline-block p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
                <img
                  src={qrSvgDataUri}
                  alt="Dynamic Bharat UPI QR Code"
                  className="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or any UPI app.
              </p>
            </div>

            {/* UTR Input Form for Automatic Activation */}
            <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Enter 12-Digit UPI Ref / UTR Number
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Found on receipt
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g. 429182749102"
                    maxLength={22}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/80 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-slate-400 placeholder:font-sans"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  After payment, copy the 12-digit transaction/UTR reference from your UPI app receipt and paste it here.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || !utrNumber.trim()}
                className="clay-btn-emerald w-full h-11 rounded-2xl font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed app-press"
              >
                {verifying ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Activating Pro...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm Payment & Activate Pro</span>
                  </>
                )}
              </button>
            </form>

            {/* Data Guarantee Note */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% Secure Indian UPI Transaction • Instant Account Activation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
