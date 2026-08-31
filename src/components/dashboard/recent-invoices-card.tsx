"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { Invoice } from "@/types";
import { INVOICE_STATUSES } from "@/constants/status-types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Receipt, ArrowUpRight, Plus, ReceiptText } from "lucide-react";

export function RecentInvoicesCard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InvoiceService.getInvoices().then((data) => {
      setInvoices(data ? data.slice(0, 5) : []);
      setIsLoading(false);
    });
  }, []);

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

        {/* Dynamic Invoices List */}
        {invoices.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="h-10 w-10 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No invoices yet</p>
              <p className="text-[11px] text-slate-400">Create your first client invoice or convert a quote.</p>
            </div>
            <Link
              href="/invoices/new"
              className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-100/80">
            {invoices.map((inv) => {
              const statusConfig = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.due;
              const formattedAmount = formatCurrency(inv.totalAmount, inv.currency);

              const formattedBalanceDue = formatCurrency(inv.balanceDue, inv.currency);

              return (
                <div
                  key={inv.id}
                  className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/70 rounded-2xl px-2.5 -mx-2.5 transition-all duration-150"
                >
                  {/* Left: Info hierarchy */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/invoices/${inv.id}/preview`}
                        className="text-xs font-extrabold text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        #{inv.invoiceNumber}
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

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium truncate">
                      <span className="shrink-0">{formatDate(inv.issueDate)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate">
                        {inv.status === "paid"
                          ? "100% Settled"
                          : inv.status === "partially_paid"
                          ? `Partial (${formattedBalanceDue} remaining)`
                          : `${formattedBalanceDue} balance due`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0">
                    <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                      {formattedAmount}
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
                      {inv.status === "paid" ? "Paid in Full" : `Due: ${formattedBalanceDue}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
