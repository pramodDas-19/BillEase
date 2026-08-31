"use client";

import React, { useState, useEffect } from "react";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Payment } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ReceiptText,
  Wallet,
  Hourglass,
  AlertTriangle,
} from "lucide-react";

export function SummaryCards() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [invData, payData] = await Promise.all([
          InvoiceService.getInvoices(),
          PaymentService.getPayments(),
        ]);
        setInvoices(invData || []);
        setPayments(payData || []);
      } catch (err) {
        console.error("Failed to load dashboard summary cards data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
  
  const today = new Date().toISOString().split("T")[0];
  const overdueInvoices = invoices.filter(
    (i) => i.balanceDue > 0 && (i.status === "overdue" || (i.dueDate && i.dueDate < today))
  );
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

  const metrics = [
    {
      id: "total-invoiced",
      title: "Total Invoiced",
      amount: totalInvoiced,
      countLabel: `${invoices.length} invoices`,
      contextText: "Total billed to date",
      icon: ReceiptText,
      bgGradient: "from-slate-50/80 via-white to-blue-50/20",
      iconBg: "bg-slate-100 text-slate-700 border border-slate-200/80",
      tagBg: "bg-blue-50/90 border border-blue-200/80 text-blue-700",
    },
    {
      id: "collected",
      title: "Received / Collected",
      amount: totalCollected,
      countLabel: `${payments.length} receipts`,
      contextText: "Direct bank settlements",
      icon: Wallet,
      bgGradient: "from-emerald-50/30 via-white to-teal-50/20",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
      tagBg: "bg-emerald-50/90 border border-emerald-200/80 text-emerald-700",
    },
    {
      id: "outstanding",
      title: "Outstanding Receivables",
      amount: totalOutstanding,
      countLabel: `${invoices.filter((i) => i.balanceDue > 0).length} pending`,
      contextText: "Awaiting client settlement",
      icon: Hourglass,
      bgGradient: "from-amber-50/30 via-white to-orange-50/20",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
      tagBg: "bg-amber-50/90 border border-amber-200/80 text-amber-700",
    },
    {
      id: "overdue",
      title: "Overdue Attention",
      amount: totalOverdue,
      countLabel: `${overdueInvoices.length} overdue`,
      contextText: overdueInvoices.length > 0 ? "Urgent reminder required" : "No overdue bills",
      icon: AlertTriangle,
      bgGradient: "from-rose-50/30 via-white to-red-50/20",
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
      tagBg: "bg-rose-50/90 border border-rose-200/80 text-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            key={metric.id}
            className={cn(
              "clay-card p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group",
              `bg-gradient-to-br ${metric.bgGradient}`
            )}
          >
            {/* Top row: Label & Clean Icon Squircle */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {metric.title}
              </span>
              <div
                className={cn(
                  "clay-icon-squircle p-2.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                  metric.iconBg
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Middle: Large Dynamic Amount */}
            <div className="my-3">
              <h3 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900">
                {isLoading ? "..." : formatCurrency(metric.amount, "INR")}
              </h3>
            </div>

            {/* Bottom: Dynamic Tag + Context */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span
                className={cn(
                  "clay-tag inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold shrink-0",
                  metric.tagBg
                )}
              >
                {metric.countLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {metric.contextText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
