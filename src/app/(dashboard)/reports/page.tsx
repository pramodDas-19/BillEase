"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Palette,
  CreditCard,
  Users,
  ReceiptText,
} from "lucide-react";

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">("month");

  // Report mock analytics data
  const monthlyData = [
    { month: "Aug 2026", invoiced: 345000, collected: 285000, pending: 60000, percentage: 82.6 },
    { month: "Jul 2026", invoiced: 280000, collected: 265000, pending: 15000, percentage: 94.6 },
    { month: "Jun 2026", invoiced: 210000, collected: 195000, pending: 15000, percentage: 92.8 },
    { month: "May 2026", invoiced: 165000, collected: 165000, pending: 0, percentage: 100 },
  ];

  const categorySplit = [
    { name: "Event Staging, Sound & LED", amount: 485000, percentage: 61, color: "bg-purple-600" },
    { name: "Flex Banners & Sunboard Print", amount: 220000, percentage: 28, color: "bg-blue-600" },
    { name: "Graphic Design & Branding", amount: 88000, percentage: 11, color: "bg-pink-600" },
  ];

  const topClients = [
    { id: "client-3", name: "Priya Events", totalBilled: 380000, balanceDue: 15000, status: "Partially Paid" },
    { id: "client-1", name: "Rahul Sharma (Sharma Tech)", totalBilled: 220000, balanceDue: 60000, status: "Partially Paid" },
    { id: "client-5", name: "Zenith Studio", totalBilled: 180000, balanceDue: 0, status: "Settled" },
    { id: "client-2", name: "ABC Corporation", totalBilled: 145000, balanceDue: 25000, status: "Overdue" },
    { id: "client-6", name: "Sunil Kapoor", totalBilled: 110000, balanceDue: 0, status: "Settled" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Executive Business Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Cash collection efficiency, revenue streams, and client lifetime valuation.
          </p>
        </div>

        {/* Timeframe selector & Export buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Chips */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setTimeframe("month")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                timeframe === "month"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe("quarter")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                timeframe === "quarter"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              This Quarter
            </button>
            <button
              onClick={() => setTimeframe("year")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                timeframe === "year"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              FY 2026-27
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={() => window.print()}
            className="clay-icon-squircle flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* 4 Top Executive Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="clay-card p-5 bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quotation Win Rate
            </span>
            <div className="clay-icon-squircle p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900">
              75.0%
            </h3>
            <p className="text-[11px] text-purple-700 font-bold mt-1 flex items-center gap-1">
              <span>4 of 6 proposals accepted</span>
            </p>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Collection Rate
            </span>
            <div className="clay-icon-squircle p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-emerald-800">
              82.6%
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">
              ₹2.85L collected of ₹3.45L
            </p>
          </div>
        </div>

        {/* Receivables Aging */}
        <div className="clay-card p-5 bg-gradient-to-br from-amber-50/30 via-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Outstanding Due
            </span>
            <div className="clay-icon-squircle p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-amber-800">
              ₹ 60,000
            </h3>
            <p className="text-[11px] text-amber-700 font-bold mt-1">
              Awaiting client settlements
            </p>
          </div>
        </div>

        {/* Top Revenue Channel */}
        <div className="clay-card p-5 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Top Service Stream
            </span>
            <div className="clay-icon-squircle p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
              Events & Rigging
            </h3>
            <p className="text-[11px] text-blue-700 font-bold mt-1">
              61% of total business revenue
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Cash Flow Trend + Revenue Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Month-over-Month Cash Flow Bar Comparison */}
        <div className="lg:col-span-2 clay-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Month-over-Month Cash Flow Comparison
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Billed Invoice Value vs. Actual Cash Collected
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-slate-300" />
                <span>Billed</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                <span>Collected</span>
              </span>
            </div>
          </div>

          {/* Visual Bar Graph */}
          <div className="space-y-4 pt-1">
            {monthlyData.map((row) => (
              <div key={row.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{row.month}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 font-semibold">
                      Billed: {formatCurrency(row.invoiced, "INR")}
                    </span>
                    <span className="text-emerald-700 font-extrabold">
                      Collected: {formatCurrency(row.collected, "INR")} ({row.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Dual Visual Bar */}
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${(row.collected / row.invoiced) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  />
                  <div
                    style={{ width: `${(row.pending / row.invoiced) * 100}%` }}
                    className="bg-amber-300 h-full rounded-r-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Revenue Breakdown by Category */}
        <div className="clay-card p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Revenue by Service Line
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Service distribution of all sales
            </p>
          </div>

          <div className="space-y-4">
            {categorySplit.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 truncate">{cat.name}</span>
                  <span className="text-slate-900 font-extrabold">{cat.percentage}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className={cn("h-full rounded-full transition-all duration-500", cat.color)}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium text-right">
                  {formatCurrency(cat.amount, "INR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Client Accounts by Lifetime Spend */}
      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Top Client Accounts by Lifetime Value
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Ranked by cumulative billed spend and settlement status
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
          >
            <span>View All Clients</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4 text-right">Lifetime Billed</th>
                <th className="py-3.5 px-4 text-right">Current Balance Due</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-center">Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                    {client.name}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                    {formatCurrency(client.totalBilled, "INR")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                    <span className={client.balanceDue > 0 ? "text-amber-700" : "text-emerald-700"}>
                      {client.balanceDue > 0 ? formatCurrency(client.balanceDue, "INR") : "Settled"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        "clay-tag inline-block px-2 py-0.5 text-[10px] font-bold border",
                        client.balanceDue === 0
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : client.status === "Overdue"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href={`/clients`}
                      className="clay-icon-squircle p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 inline-block transition-colors"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
