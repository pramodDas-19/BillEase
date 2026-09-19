"use client";

import React, { useState, useEffect, useMemo } from "react";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Payment } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant";
import {
  ReceiptText,
  Wallet,
  Hourglass,
  Calendar,
  Globe,
  TrendingUp,
} from "lucide-react";
import { UpiCollectionTracker } from "./upi-collection-tracker";

type TimeframeOption = "this_month" | "all_time";

export function SummaryCards() {
  const { currentTenant } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("this_month");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [invData, payData] = await Promise.all([
          InvoiceService.getInvoices(),
          PaymentService.getPayments(),
        ]);
        if (!isMounted) return;
        setInvoices(invData || []);
        setPayments(payData || []);
      } catch (err) {
        console.error("Failed to load dashboard summary cards data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentTenant?.id]);

  // Calendar month metadata
  const { currentMonthName, currentFullMonthName, currentYear, isCurrentMonth } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthName = now.toLocaleString("en-IN", { month: "short" });
    const currentFullMonthName = now.toLocaleString("en-IN", { month: "long" });

    const isCurrentMonth = (dateStr?: string | null): boolean => {
      if (!dateStr) return false;
      const datePart = dateStr.split("T")[0];
      const parts = datePart.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === currentYear && m === currentMonth;
      }
      const parsed = new Date(dateStr);
      return (
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() === currentYear &&
        parsed.getMonth() === currentMonth
      );
    };

    return { currentMonthName, currentFullMonthName, currentYear, isCurrentMonth };
  }, []);

  // Compute metrics based on timeframe
  const metricsData = useMemo(() => {
    const allTimeInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const allTimePaymentsSum = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const allTimeInvoicesPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const allTimeCollected = allTimePaymentsSum > 0 ? allTimePaymentsSum : allTimeInvoicesPaid;
    const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
    const pendingInvoicesCount = invoices.filter((i) => (i.balanceDue || 0) > 0).length;

    // Filter current calendar month
    const thisMonthInvoices = invoices.filter((i) => isCurrentMonth(i.issueDate || i.createdAt));
    const thisMonthInvoiced = thisMonthInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const thisMonthPayments = payments.filter((p) => isCurrentMonth(p.paymentDate || p.createdAt));
    const thisMonthCollectedFromPayments = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // If payments table is empty but invoices were recorded as paid this month, fallback gracefully
    const thisMonthInvoicesPaid = thisMonthInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const thisMonthCollected =
      thisMonthCollectedFromPayments > 0 ? thisMonthCollectedFromPayments : thisMonthInvoicesPaid;

    if (timeframe === "this_month") {
      return [
        {
          id: "total-invoiced",
          title: "Invoiced (This Month)",
          amount: thisMonthInvoiced,
          countLabel: `${thisMonthInvoices.length} ${thisMonthInvoices.length === 1 ? "invoice" : "invoices"}`,
          contextText: `Billed in ${currentMonthName} ${currentYear}`,
          icon: ReceiptText,
          bgGradient: "from-slate-50/80 via-white to-blue-50/20",
          iconBg: "bg-slate-100 text-slate-700 border border-slate-200/80",
          tagBg: "bg-blue-50/90 border border-blue-200/80 text-blue-700",
        },
        {
          id: "collected",
          title: "Earned / Collected",
          amount: thisMonthCollected,
          countLabel: `${thisMonthPayments.length} ${thisMonthPayments.length === 1 ? "receipt" : "receipts"}`,
          contextText: `Collected in ${currentMonthName} ${currentYear}`,
          icon: Wallet,
          bgGradient: "from-emerald-50/30 via-white to-teal-50/20",
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
          tagBg: "bg-emerald-50/90 border border-emerald-200/80 text-emerald-700",
        },
        {
          id: "outstanding",
          title: "Outstanding Receivables",
          amount: totalOutstanding,
          countLabel: `${pendingInvoicesCount} pending`,
          contextText: "Awaiting client settlement",
          icon: Hourglass,
          bgGradient: "from-amber-50/30 via-white to-orange-50/20",
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
          tagBg: "bg-amber-50/90 border border-amber-200/80 text-amber-700",
        },
      ];
    }

    // All-time mode
    return [
      {
        id: "total-invoiced",
        title: "Total Invoiced",
        amount: allTimeInvoiced,
        countLabel: `${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`,
        contextText: "Total billed to date",
        icon: ReceiptText,
        bgGradient: "from-slate-50/80 via-white to-blue-50/20",
        iconBg: "bg-slate-100 text-slate-700 border border-slate-200/80",
        tagBg: "bg-blue-50/90 border border-blue-200/80 text-blue-700",
      },
      {
        id: "collected",
        title: "Received / Collected",
        amount: allTimeCollected,
        countLabel: `${payments.length} ${payments.length === 1 ? "receipt" : "receipts"}`,
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
        countLabel: `${pendingInvoicesCount} pending`,
        contextText: "Awaiting client settlement",
        icon: Hourglass,
        bgGradient: "from-amber-50/30 via-white to-orange-50/20",
        iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
        tagBg: "bg-amber-50/90 border border-amber-200/80 text-amber-700",
      },
    ];
  }, [invoices, payments, timeframe, isCurrentMonth, currentMonthName, currentYear]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Timeframe Switcher & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="clay-icon-squircle p-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              Financial Overview
              <span className="text-[11px] font-semibold text-slate-500 normal-case hidden xs:inline">
                • {timeframe === "this_month" ? `${currentFullMonthName} ${currentYear}` : "All-Time Lifetime"}
              </span>
            </span>
          </div>
        </div>

        {/* Neo-Clay Segmented Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-inner self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe("this_month")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
              timeframe === "this_month"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200/70"
                : "text-slate-500 hover:text-slate-900"
            )}
            title={`View figures for ${currentFullMonthName} ${currentYear}`}
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>This Month ({currentMonthName})</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("all_time")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
              timeframe === "all_time"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200/70"
                : "text-slate-500 hover:text-slate-900"
            )}
            title="View lifetime cumulative figures"
          >
            <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>All-Time</span>
          </button>
        </div>
      </div>

      {/* Top Row: 3 Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {metricsData.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.id}
              className={cn(
                "clay-card p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group transition-all duration-200 hover:shadow-md",
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

      {/* Bottom Row: Full-width UPI Collection Tracker */}
      <UpiCollectionTracker payments={payments} isLoading={isLoading} />
    </div>
  );
}

