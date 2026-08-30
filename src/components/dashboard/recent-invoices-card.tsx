import React from "react";
import Link from "next/link";
import { MOCK_DASHBOARD_INVOICES } from "@/mock/dashboard.mock";
import { INVOICE_STATUSES } from "@/constants/status-types";
import { cn } from "@/lib/utils";
import { Receipt, ArrowUpRight } from "lucide-react";

export function RecentInvoicesCard() {
  return (
    <div className="clay-card p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="clay-icon-squircle p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Invoices
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Billed orders & payment settlements
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

        {/* List items */}
        <div className="mt-3 divide-y divide-slate-100/80">
          {MOCK_DASHBOARD_INVOICES.map((inv) => {
            const statusConfig = INVOICE_STATUSES[inv.status];

            return (
              <div
                key={inv.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/70 rounded-2xl px-2.5 -mx-2.5 transition-all duration-150"
              >
                {/* Left: Info hierarchy */}
                <div className="min-w-0">
                  {/* Line 1: Code + Client + Status Tag */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/invoices"
                      className="text-xs font-extrabold text-slate-900 hover:text-emerald-600 transition-colors"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <span className="text-slate-300 text-xs">•</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
                      {inv.clientName}
                    </h4>
                    <span
                      className={cn(
                        "clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold border shrink-0",
                        statusConfig.bgClass,
                        statusConfig.textClass,
                        "border-slate-200/80"
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Line 2: Issue Date + Settlement context */}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium truncate">
                    <span className="shrink-0">{inv.date}</span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate">
                      {inv.status === "paid"
                        ? "100% Settled"
                        : inv.status === "partially_paid"
                        ? `Partial (${inv.formattedBalanceDue} remaining)`
                        : `${inv.formattedBalanceDue} balance due`}
                    </span>
                  </div>
                </div>

                {/* Right: Total Amount + Settlement Badge */}
                <div className="text-right shrink-0">
                  <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                    {inv.formattedAmount}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] font-bold mt-0.5",
                      inv.status === "paid"
                        ? "text-emerald-600"
                        : inv.status === "overdue"
                        ? "text-rose-600"
                        : "text-amber-600"
                    )}
                  >
                    {inv.status === "paid" ? "Paid in Full" : `Due: ${inv.formattedBalanceDue}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
