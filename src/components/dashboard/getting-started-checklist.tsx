"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTenantContext } from "@/context/tenant-context";
import { ClientService } from "@/services/client.service";
import { InvoiceService } from "@/services/invoice.service";
import { QuotationService } from "@/services/quotation.service";
import { PaymentService } from "@/services/payment.service";
import {
  computeChecklistState,
  getChecklistProgress,
  getChecklistItems,
  ChecklistState,
} from "@/lib/onboarding";
import {
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
  Sparkles,
  PartyPopper,
  Building2,
  UserPlus,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GettingStartedChecklist() {
  const { currentTenant, updateTenantSettings } = useTenantContext();
  const [state, setState] = useState<ChecklistState>({
    businessDetailsComplete: false,
    hasFirstClient: false,
    hasFirstDocument: false,
    hasSentPaymentLink: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed in settings
  const settings = currentTenant?.settings as Record<string, any> | undefined;
  const isDismissedInSettings = Boolean(settings?.onboarding_checklist_dismissed_at);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [clients, invoices, quotations, payments] = await Promise.all([
          ClientService.getClients(),
          InvoiceService.getInvoices(),
          QuotationService.getQuotations(),
          PaymentService.getPayments(),
        ]);

        if (!isMounted) return;

        const computed = computeChecklistState(
          currentTenant,
          clients?.length || 0,
          invoices?.length || 0,
          quotations?.length || 0,
          payments?.length || 0
        );
        setState(computed);
      } catch (err) {
        console.warn("Could not compute checklist stats:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [currentTenant]);

  const progress = getChecklistProgress(state);
  const items = getChecklistItems(state);

  // Icons mapping for steps
  const iconMap = {
    businessDetailsComplete: Building2,
    hasFirstClient: UserPlus,
    hasFirstDocument: FileText,
    hasSentPaymentLink: CreditCard,
  };

  const handleDismiss = async () => {
    setIsDismissed(true);
    if (!currentTenant) return;

    if (typeof window !== "undefined") {
      localStorage.setItem(`billease_checklist_dismissed_${currentTenant.id}`, new Date().toISOString());
    }

    try {
      await updateTenantSettings({
        onboarding_checklist_dismissed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to persist checklist dismissal in context:", e);
    }

    try {
      await fetch("/api/tenants/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: "dismiss_checklist",
        }),
      });
    } catch (err) {
      console.warn("Failed to persist checklist dismissal to backend API:", err);
    }
  };

  if (isLoading || isDismissed || isDismissedInSettings) {
    return null;
  }

  // Auto-collapse when all 4 steps are completed
  if (progress === 4) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-50/60 to-emerald-500/10 border border-emerald-200/80 p-3.5 px-4 sm:px-5 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in-50 duration-300">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-sm">
            🎉
          </span>
          <p className="text-xs font-bold text-emerald-950">
            You&apos;re all set up — nice work! All setup milestones completed.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          title="Dismiss banner"
          className="p-1 rounded-lg text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100/60 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="clay-card p-5 sm:p-6 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-3xl shadow-xs transition-all animate-in fade-in-50 duration-300">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="clay-icon-squircle flex h-6 w-6 items-center justify-center bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
              🚀
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Let&apos;s get you set up
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-8">
            Complete these 4 simple steps to send your first invoice and collect payments
          </p>
        </div>

        <div className="flex items-center gap-3 pl-8 sm:pl-0">
          {/* Progress dots & counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    idx < progress
                      ? "bg-emerald-500 scale-110"
                      : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">
              {progress} of 4 done
            </span>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            title="Dismiss checklist"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-4">
        <div
          className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(progress / 4) * 100}%` }}
        />
      </div>

      {/* 4 Checklist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {items.map((item) => {
          const Icon = iconMap[item.id] || FileText;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200",
                item.isCompleted
                  ? "bg-slate-50/60 border-slate-200/60 text-slate-400 hover:bg-slate-100/60"
                  : "bg-white border-slate-200/90 text-slate-800 hover:border-emerald-300 hover:shadow-xs hover:scale-[1.01]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    item.isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                  )}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <span
                    className={cn(
                      "text-xs font-bold block truncate",
                      item.isCompleted
                        ? "line-through text-slate-400"
                        : "text-slate-900 group-hover:text-emerald-700"
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {item.description}
                  </span>
                </div>
              </div>

              <ArrowRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5",
                  item.isCompleted ? "opacity-0" : "text-slate-400 group-hover:text-emerald-600"
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
