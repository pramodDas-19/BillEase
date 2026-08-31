"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceService } from "@/services/invoice.service";
import { Invoice } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getWhatsAppInvoiceShareUrl } from "@/lib/whatsapp";
import {
  AlertTriangle,
  ArrowUpRight,
  Send,
  Check,
  BellRing,
  Phone,
  CheckCircle2,
} from "lucide-react";

export function PaymentAttention() {
  const router = useRouter();
  const [attentionInvoices, setAttentionInvoices] = useState<Invoice[]>([]);
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InvoiceService.getInvoices().then((invoices) => {
      const today = new Date().toISOString().split("T")[0];
      const pending = (invoices || []).filter(
        (i) => i.balanceDue > 0 && (i.status === "overdue" || (i.dueDate && i.dueDate <= today))
      );
      setAttentionInvoices(pending.slice(0, 5));
      setIsLoading(false);
    });
  }, []);

  const handleSendReminder = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (inv.clientPhone) {
      const url = getWhatsAppInvoiceShareUrl({
        clientPhone: inv.clientPhone,
        clientName: inv.clientName,
        invoiceNumber: inv.invoiceNumber,
        invoiceId: inv.id,
        totalAmount: inv.totalAmount,
        balanceDue: inv.balanceDue,
        currency: inv.currency,
      });
      window.open(url, "_blank");
    }

    setRemindedIds((prev) => ({ ...prev, [inv.id]: true }));
  };

  const handleCallClient = (e: React.MouseEvent) => {
    e.stopPropagation();
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
                Payment Attention Radar
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Overdue and due invoice collections
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

        {/* Dynamic Attention List */}
        {attentionInvoices.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">All Collections Up to Date!</p>
              <p className="text-[11px] text-slate-400">Zero overdue bills or pending payment emergencies.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-100/80">
            {attentionInvoices.map((inv) => {
              const isReminded = remindedIds[inv.id];
              const formattedBalanceDue = formatCurrency(inv.balanceDue, inv.currency);

              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}/preview`)}
                  className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 group hover:bg-slate-50/80 rounded-2xl px-2.5 -mx-2.5 transition-all duration-150 cursor-pointer"
                >
                  {/* Left: Avatar + Client Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="clay-icon-squircle h-9 w-9 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-700 font-extrabold text-xs shrink-0 border border-rose-200/60">
                      {inv.clientName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                        {inv.clientName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold border whitespace-nowrap bg-rose-50 text-rose-700 border-rose-200/80">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          Due {formatDate(inv.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Action Controls */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <span className="block text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">
                        {formattedBalanceDue}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        Balance Due
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {inv.clientPhone && (
                        <a
                          href={`tel:${inv.clientPhone}`}
                          onClick={handleCallClient}
                          title={`Direct call ${inv.clientName}`}
                          className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}

                      <div className="w-28 sm:w-32 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleSendReminder(inv, e)}
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
                              <span>Remind</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
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
