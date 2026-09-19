"use client";

import React from "react";
import Link from "next/link";
import { useTrial } from "@/hooks/use-trial";
import { Sparkles, Zap, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  className?: string;
}

export function PlanBadge({ className }: PlanBadgeProps) {
  const { state, daysRemaining, hoursRemaining } = useTrial();

  // 1. Paid Active Plan
  if (state === "SUBSCRIBED_ACTIVE") {
    return (
      <Link
        href="/pricing"
        title="Active Subscription"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100 transition-all shadow-2xs cursor-pointer",
          className
        )}
      >
        <Zap className="h-3 w-3 text-purple-600 fill-current" />
        <span>Pro plan</span>
        <span className="text-purple-300">•</span>
        <span className="text-purple-700 font-black">Active</span>
      </Link>
    );
  }

  // 2. Early Trial (Days 1–4): Quiet, neutral slate with subtle green accent
  if (state === "TRIAL_ACTIVE_EARLY") {
    return (
      <Link
        href="/pricing"
        title="7-Day Pro Trial Active"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-900 text-white shadow-xs border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer group",
          className
        )}
      >
        <Zap className="h-3 w-3 text-emerald-400 fill-current" />
        <span className="text-slate-200 font-medium">Pro Trial</span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-bold group-hover:text-emerald-300">
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
        </span>
      </Link>
    );
  }

  // 3. Mid Trial (Days 5–6): Warm amber, gentle visibility
  if (state === "TRIAL_ACTIVE_MID") {
    return (
      <Link
        href="/pricing"
        title="Pro Trial ending soon"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 transition-all shadow-2xs cursor-pointer",
          className
        )}
      >
        <Clock className="h-3 w-3 text-amber-600" />
        <span>Pro Trial</span>
        <span className="text-amber-300">•</span>
        <span className="text-amber-800 font-extrabold">{daysRemaining} days left</span>
        <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider ml-0.5">
          Upgrade →
        </span>
      </Link>
    );
  }

  // 4. Last Day (Day 7): Warm coral (not alarm red)
  if (state === "TRIAL_LAST_DAY") {
    return (
      <Link
        href="/pricing"
        title="Last day of Pro Trial"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer animate-pulse",
          className
        )}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        <span>Last day of Pro trial</span>
        <span className="text-rose-300">•</span>
        <span className="text-rose-700 font-extrabold underline">Upgrade</span>
      </Link>
    );
  }

  // 5. 48-Hour Grace Period (Account still functions)
  if (state === "TRIAL_EXPIRED_GRACE") {
    return (
      <Link
        href="/pricing"
        title="Trial grace period active"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-all shadow-2xs cursor-pointer",
          className
        )}
      >
        <AlertCircle className="h-3 w-3 text-amber-700" />
        <span>Trial Grace Period</span>
        <span className="text-amber-400">•</span>
        <span className="text-amber-800 underline">Add Plan</span>
      </Link>
    );
  }

  // 6. Expired Locked or Downgraded Free
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-900 text-white shadow-xs border border-slate-800",
        className
      )}
    >
      <span className="text-slate-300">Free plan</span>
      <span className="text-slate-500">•</span>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-black hover:underline transition-colors"
      >
        <span>Upgrade</span>
        <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
      </Link>
    </div>
  );
}
