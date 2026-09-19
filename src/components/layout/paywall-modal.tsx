"use client";

import React from "react";
import Link from "next/link";
import { useTrial } from "@/hooks/use-trial";
import {
  ShieldCheck,
  Sparkles,
  Zap,
  X,
  FileCheck2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaywallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  actionTitle?: string;
}

export function PaywallModal({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  actionTitle,
}: PaywallModalProps) {
  const {
    isPaywallOpen,
    setIsPaywallOpen,
    paywallAction,
    stats,
    downgradeToFree,
    upgradeToPro,
  } = useTrial();

  const open = propsIsOpen !== undefined ? propsIsOpen : isPaywallOpen;
  const handleClose = () => {
    if (propsOnClose) {
      propsOnClose();
    } else {
      setIsPaywallOpen(false);
    }
  };

  if (!open) return null;

  const actionName =
    actionTitle ||
    (paywallAction === "create_invoice"
      ? "Creating new invoices"
      : paywallAction === "create_quotation"
      ? "Creating new quotations"
      : "Recording payments");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Working Close Button (Never trap the user) */}
        <button
          onClick={handleClose}
          title="Close (Maybe later)"
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Headline */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
              Subscription Required
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {actionName} needs an active plan
            </h3>
          </div>
        </div>

        {/* Reassuring Data Safety Promise */}
        <div className="my-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">Your past records are 100% safe & accessible</p>
            <p className="text-emerald-800/90 mt-0.5">
              You can always view, search, download, and export all {stats.invoiceCount > 0 ? `${stats.invoiceCount} existing invoices` : "past documents"} as PDF & CSV. BillEase never holds your business data hostage.
            </p>
          </div>
        </div>

        {/* Personalized Value Recap */}
        {stats.invoiceCount > 0 && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Real billing done on trial:</span>
            <span className="font-black text-slate-900">
              {stats.invoiceCount} invoices • {formatCurrency(stats.totalBilled)}
            </span>
          </div>
        )}

        {/* Actions & Plan Options */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            onClick={handleClose}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-emerald-200 fill-current" />
              <span>Choose a Plan (Starts at ₹1,499/mo)</span>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={downgradeToFree}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
            >
              Continue with Free Tier
            </button>

            <button
              onClick={handleClose}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Not now, keep viewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
