"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTrial } from "@/hooks/use-trial";
import { Clock, AlertTriangle, Sparkles, X, ChevronRight, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function TrialNotificationBanner() {
  const {
    state,
    daysRemaining,
    stats,
    isBannerDismissed,
    dismissBanner,
    downgradeToFree,
  } = useTrial();

  const [dismissedLocally, setDismissedLocally] = useState(false);

  // Days 1–4: No intrusive banner (passive calm experience per Claude design specs)
  if (state === "TRIAL_ACTIVE_EARLY" || state === "SUBSCRIBED_ACTIVE") {
    return null;
  }

  // Check dismissal
  if (dismissedLocally) return null;

  // 1. Days 5–6: Mid-Trial Personalized Value Banner (Dismissible)
  if (state === "TRIAL_ACTIVE_MID") {
    if (isBannerDismissed("day5")) return null;

    const hasInvoices = stats.invoiceCount > 0;

    return (
      <div className="relative z-20 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border-b border-amber-200/80 px-4 py-2.5 sm:px-6 shadow-2xs backdrop-blur-xs transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-800 font-medium">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold">
              🎯
            </span>
            <div>
              <span className="font-bold text-amber-950">
                {daysRemaining} days left on your Pro trial.{" "}
              </span>
              <span className="text-slate-700">
                {hasInvoices ? (
                  <>
                    You&apos;ve created{" "}
                    <strong className="text-slate-900 font-bold">{stats.invoiceCount} invoices</strong>{" "}
                    and billed{" "}
                    <strong className="text-emerald-700 font-bold">{formatCurrency(stats.totalBilled)}</strong>{" "}
                    so far — keep the momentum going!
                  </>
                ) : (
                  <>
                    Experience fast automated invoicing, payment reminders, and GST filing ready reports.
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Choose a plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => {
                dismissBanner("day5");
                setDismissedLocally(true);
              }}
              title="Dismiss for today"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100/50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Day 7: Last Day Urgent Banner (Dismissible, warm coral)
  if (state === "TRIAL_LAST_DAY") {
    if (isBannerDismissed("lastDay")) return null;

    return (
      <div className="relative z-20 bg-gradient-to-r from-rose-500/15 via-rose-50 to-pink-500/10 border-b border-rose-200/90 px-4 py-2.5 sm:px-6 shadow-2xs backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold">
              ⏳
            </span>
            <div>
              <span className="font-bold text-rose-950">
                Your 7-day Pro trial ends today.{" "}
              </span>
              <span className="text-slate-700">
                Pick a plan to keep billing without interruption — or switch to Free Tier anytime.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Keep Pro Access</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => {
                dismissBanner("lastDay");
                setDismissedLocally(true);
              }}
              title="Dismiss"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. 48-Hour Soft Grace Period: Account fully functional, persistent non-blocking notice
  if (state === "TRIAL_EXPIRED_GRACE") {
    return (
      <div className="relative z-20 bg-amber-500/10 border-b border-amber-300/80 px-4 py-2.5 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold">
              ⚠️
            </span>
            <div>
              <strong className="text-amber-950 font-bold">Pro Trial Ended (48h Grace Period): </strong>
              <span className="text-slate-700">
                Your document creation is still active! Add a plan within 48 hours to prevent feature pauses. All existing invoices remain 100% safe.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Choose a plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Locked State: Soft paywall notification
  if (state === "TRIAL_EXPIRED_LOCKED") {
    return (
      <div className="relative z-20 bg-rose-50/95 border-b border-rose-200 px-4 py-2.5 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold">
              ℹ️
            </span>
            <div>
              <strong className="text-rose-950 font-bold">Pro Trial Expired: </strong>
              <span className="text-slate-700">
                Document creation is paused. Your existing records, client records, and PDF exports remain <strong>100% accessible</strong>.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={downgradeToFree}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline px-2 py-1"
            >
              Continue with Free Tier
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
