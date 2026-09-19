"use client";

import React from "react";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { useTrial } from "@/hooks/use-trial";
import { formatCurrency } from "@/lib/utils";

interface RoutePaywallBlockerProps {
  documentType?: "Invoice" | "Quotation";
  backHref?: string;
}

export function RoutePaywallBlocker({
  documentType = "Invoice",
  backHref = "/invoices",
}: RoutePaywallBlockerProps) {
  const { stats, downgradeToFree } = useTrial();

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200 text-center">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs mb-5">
        <Lock className="h-8 w-8" />
      </div>

      <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
        Plan Required
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">
        Creating new {documentType.toLowerCase()}s is paused
      </h2>

      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        Your 7-day Pro trial has ended. To continue generating unlimited GST-compliant {documentType.toLowerCase()}s, automated payment reminders, and receipts, please choose a plan.
      </p>

      {/* Safety Guarantee Callout */}
      <div className="my-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-left flex items-start gap-3 text-xs text-emerald-950">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-900">Your past financial records remain 100% accessible</p>
          <p className="text-emerald-800/90 mt-0.5">
            You can always view, search, print, and export all your existing records and reports as CSV and PDF. BillEase never holds your business data hostage.
          </p>
        </div>
      </div>

      {stats.invoiceCount > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between px-4">
          <span>Your activity during trial:</span>
          <span className="font-black text-slate-900">
            {stats.invoiceCount} invoices • {formatCurrency(stats.totalBilled)}
          </span>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/pricing"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-transform active:scale-98"
        >
          <span>Choose a Plan (Starts at ₹1,499/mo)</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {documentType}s list</span>
          </Link>

          <button
            onClick={downgradeToFree}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
          >
            Continue with Free Tier
          </button>
        </div>
      </div>
    </div>
  );
}
