"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_PAYMENT_ATTENTION } from "@/mock/dashboard.mock";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  Send,
  Check,
  BellRing,
  Phone,
} from "lucide-react";

export function PaymentAttention() {
  const router = useRouter();
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});

  const handleSendReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRemindedIds((prev) => ({ ...prev, [id]: true }));
  };

  const handleCallClient = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const statusPillStyles = {
    overdue: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs shadow-rose-500/10",
    due_today: "bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs shadow-amber-500/10",
    upcoming: "bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs shadow-blue-500/10",
  };

  return (
    <div
      id="payment-attention"
      className="clay-card p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-300"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="clay-icon-squircle p-2 rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Payment Attention
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Overdue and upcoming invoice collections
              </p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* List of Attention Items */}
        <div className="mt-3 divide-y divide-slate-100/80">
          {MOCK_PAYMENT_ATTENTION.map((item) => {
            const isReminded = remindedIds[item.id];

            return (
              <div
                key={item.id}
                onClick={() => router.push("/invoices")}
                className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 group hover:bg-slate-50/80 rounded-2xl px-2.5 -mx-2.5 transition-all duration-150 cursor-pointer"
              >
                {/* Left: Avatar + Client Name (Full, unclipped) & Subtext Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="clay-icon-squircle h-9 w-9 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-800 group-hover:text-emerald-800 font-bold text-xs shrink-0 border border-slate-200/60 transition-colors">
                    {item.clientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    {/* Line 1: Full Client Name */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {item.clientName}
                    </h4>

                    {/* Line 2: Status Pill • Date info */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          "clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold border whitespace-nowrap shrink-0",
                          statusPillStyles[item.status]
                        )}
                      >
                        {item.statusText}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        {item.dateInfo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action Controls */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <span className="block text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">
                      {item.formattedAmount}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      Balance Due
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Direct Call Button (Green) */}
                    {item.clientPhone && (
                      <a
                        href={`tel:${item.clientPhone}`}
                        onClick={handleCallClient}
                        title={`Direct call ${item.clientName} (${item.clientPhone})`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-2xs transition-all cursor-pointer shrink-0"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {/* Send Reminder or Alert Status */}
                    <div className="w-28 sm:w-32 flex justify-end">
                      {item.canSendReminder ? (
                        <button
                          onClick={(e) => handleSendReminder(item.id, e)}
                          disabled={isReminded}
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap w-full",
                            isReminded
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                              : "clay-btn-primary"
                          )}
                        >
                          {isReminded ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 text-emerald-400" />
                              <span>Send Reminder</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-1 h-8 px-2 rounded-xl bg-slate-100/70 border border-slate-200/60 text-[10px] font-semibold text-slate-500 whitespace-nowrap w-full">
                          <BellRing className="h-3 w-3 text-slate-400" />
                          <span>Auto-alert set</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
