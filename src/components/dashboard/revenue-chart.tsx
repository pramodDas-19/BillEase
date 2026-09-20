"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Payment } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Plus, ArrowUpRight, BarChart3 } from "lucide-react";

export type TimeRange = "7D" | "30D" | "3M" | "6M" | "1Y";

export interface ChartDataPoint {
  label: string;
  subLabel?: string;
  invoiced: number;
  collected: number;
}

// Safely parse date from YYYY-MM-DD or ISO string
function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function RevenueChart() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30D");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([InvoiceService.getInvoices(), PaymentService.getPayments()])
      .then(([invs, pays]) => {
        if (mounted) {
          setInvoices(invs || []);
          setPayments(pays || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load revenue data:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const ranges: TimeRange[] = ["7D", "30D", "3M", "6M", "1Y"];

  // Compute 100% REAL calendar data points based on actual invoice & payment records
  const currentData: ChartDataPoint[] = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    // Helper: is invoice or payment valid (skip cancelled invoices or failed payments)
    const activeInvoices = invoices.filter((inv) => inv.status !== "cancelled");
    const activePayments = payments.filter((pay) => pay.status !== "failed" && pay.status !== "refunded");

    if (selectedRange === "7D") {
      const points: ChartDataPoint[] = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

        const invoiced = activeInvoices
          .filter((inv) => {
            const date = parseDate(inv.issueDate || inv.createdAt);
            if (!date) return false;
            const t = date.getTime();
            return t >= start && t <= end;
          })
          .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

        const collected = activePayments
          .filter((pay) => {
            const date = parseDate(pay.paymentDate || pay.createdAt);
            if (!date) return false;
            const t = date.getTime();
            return t >= start && t <= end;
          })
          .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

        const dayName = i === 0 ? "Today" : dayNames[d.getDay()];
        const dayNum = d.getDate();

        points.push({
          label: `${dayName} ${dayNum}`,
          invoiced: Math.round(invoiced),
          collected: Math.round(collected),
        });
      }

      return points;
    }

    if (selectedRange === "30D") {
      // 4 rolling weekly buckets covering the last 28-30 days
      const points: ChartDataPoint[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let w = 3; w >= 0; w--) {
        const startOffsetDays = (w + 1) * 7;
        const endOffsetDays = w * 7;

        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - startOffsetDays, 0, 0, 0, 0).getTime();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - endOffsetDays, 23, 59, 59, 999).getTime();

        const startDate = new Date(start);
        const endDate = new Date(end);

        const invoiced = activeInvoices
          .filter((inv) => {
            const date = parseDate(inv.issueDate || inv.createdAt);
            if (!date) return false;
            const t = date.getTime();
            return t >= start && t <= end;
          })
          .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

        const collected = activePayments
          .filter((pay) => {
            const date = parseDate(pay.paymentDate || pay.createdAt);
            if (!date) return false;
            const t = date.getTime();
            return t >= start && t <= end;
          })
          .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

        const weekLabel = `Week ${4 - w}`;
        const subLabel = `${monthNames[startDate.getMonth()]} ${startDate.getDate()}-${endDate.getDate()}`;

        points.push({
          label: weekLabel,
          subLabel,
          invoiced: Math.round(invoiced),
          collected: Math.round(collected),
        });
      }

      return points;
    }

    // Multi-month views: 3M, 6M, 1Y
    const numMonths = selectedRange === "3M" ? 3 : selectedRange === "6M" ? 6 : 12;
    const points: ChartDataPoint[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let m = numMonths - 1; m >= 0; m--) {
      const year = now.getFullYear();
      const monthIndex = now.getMonth() - m;
      const targetDate = new Date(year, monthIndex, 1);

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();

      const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0).getTime();
      const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999).getTime();

      const invoiced = activeInvoices
        .filter((inv) => {
          const date = parseDate(inv.issueDate || inv.createdAt);
          if (!date) return false;
          const t = date.getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

      const collected = activePayments
        .filter((pay) => {
          const date = parseDate(pay.paymentDate || pay.createdAt);
          if (!date) return false;
          const t = date.getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

      points.push({
        label: monthNames[targetMonth],
        invoiced: Math.round(invoiced),
        collected: Math.round(collected),
      });
    }

    return points;
  }, [selectedRange, invoices, payments]);

  // Aggregate totals for the selected period
  const totalInvoicedPeriod = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.invoiced, 0),
    [currentData]
  );
  const totalCollectedPeriod = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.collected, 0),
    [currentData]
  );
  const hasDataInPeriod = totalInvoicedPeriod > 0 || totalCollectedPeriod > 0;

  // Calculate dynamic max for chart scaling
  const maxVal = Math.max(
    ...currentData.flatMap((d) => [d.invoiced, d.collected]),
    0
  );

  // If no data exists, set baseline scale to 10,000 for aesthetics, else 15% headroom
  const chartMax = hasDataInPeriod ? Math.max(Math.ceil(maxVal * 1.15), 1000) : 10000;

  // Dimensions for SVG viewport
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 44;
  const paddingY = 24;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Helper to map data index & value to coordinate
  const getCoords = (index: number, value: number) => {
    const x = paddingX + (index / (currentData.length - 1 || 1)) * graphWidth;
    const y = svgHeight - paddingY - (value / chartMax) * graphHeight;
    return { x, y };
  };

  // Generate smooth SVG path
  const generateSmoothPath = (values: number[]) => {
    if (values.length === 0) return "";
    const points = values.map((val, idx) => getCoords(idx, val));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const invoicedPath = generateSmoothPath(currentData.map((d) => d.invoiced));
  const collectedPath = generateSmoothPath(currentData.map((d) => d.collected));

  // Area path for gradient fill
  const lastIndex = currentData.length - 1;
  const firstX = getCoords(0, 0).x;
  const lastX = getCoords(lastIndex, 0).x;
  const baseY = svgHeight - paddingY;

  const invoicedAreaPath = `${invoicedPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  const collectedAreaPath = `${collectedPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  const activePoint =
    hoveredIndex !== null ? currentData[hoveredIndex] : currentData[currentData.length - 1];

  // Helper for dynamic axis labels (k / L formatting)
  const formatAxisValue = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${Math.round(val)}`;
  };

  return (
    <div className="clay-card p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Revenue Overview
            </h3>
            {hasDataInPeriod && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <TrendingUp className="h-3 w-3" />
                <span>Live Data</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Billed vs Collected cash performance
          </p>
        </div>

        {/* Time range selector pills */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-inner self-start sm:self-auto overflow-x-auto max-w-full no-scrollbar">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => {
                setSelectedRange(range);
                setHoveredIndex(null);
              }}
              className={`rounded-xl px-2.5 sm:px-3 py-1 text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
                selectedRange === range
                  ? "clay-pill-active font-extrabold text-slate-900 bg-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Current Hover Snapshot */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-800 shadow-xs" />
            <span className="font-semibold text-slate-600">Invoiced</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="font-semibold text-slate-600">Collected</span>
          </div>
        </div>

        {activePoint && (
          <div className="clay-icon-container flex items-center gap-2 sm:gap-3 bg-slate-50/90 border border-slate-200/70 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs">
            <span className="font-bold text-slate-500">
              {activePoint.label}
              {activePoint.subLabel ? ` (${activePoint.subLabel})` : ""}:
            </span>
            <span className="text-slate-900 font-extrabold">
              Inv: {formatCurrency(activePoint.invoiced, "INR")}
            </span>
            <span className="text-emerald-700 font-extrabold">
              Col: {formatCurrency(activePoint.collected, "INR")}
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative mt-4 w-full overflow-hidden min-h-[220px]">
        {/* Empty State Banner when user has ₹0 activity */}
        {!hasDataInPeriod && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl p-4 text-center">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              No revenue activity in {selectedRange}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5 font-medium">
              Create an invoice or record a payment to see your billed vs collected performance.
            </p>
            <Link
              href="/invoices/new"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-all active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Invoice</span>
            </Link>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
        >
          <defs>
            <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Soft Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((factor) => {
            const y = svgHeight - paddingY - factor * graphHeight;
            const gridVal = chartMax * factor;
            return (
              <g key={factor}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                >
                  {formatAxisValue(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Baseline Zero Line */}
          <line
            x1={paddingX}
            y1={baseY}
            x2={svgWidth - paddingX}
            y2={baseY}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <text
            x={paddingX - 6}
            y={baseY + 3}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="9"
            fontWeight="600"
          >
            ₹0
          </text>

          {/* Area Fills */}
          <path d={invoicedAreaPath} fill="url(#invoicedGrad)" />
          <path d={collectedAreaPath} fill="url(#collectedGrad)" />

          {/* Curves */}
          <path
            d={invoicedPath}
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={collectedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover interactive markers & X-Axis Labels */}
          {currentData.map((d, idx) => {
            const invCoord = getCoords(idx, d.invoiced);
            const colCoord = getCoords(idx, d.collected);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit testing column */}
                <rect
                  x={invCoord.x - graphWidth / currentData.length / 2}
                  y={0}
                  width={graphWidth / currentData.length}
                  height={svgHeight}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={invCoord.x}
                    y1={paddingY}
                    x2={invCoord.x}
                    y2={baseY}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                <circle
                  cx={invCoord.x}
                  cy={invCoord.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#334155"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                <circle
                  cx={colCoord.x}
                  cy={colCoord.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                <text
                  x={invCoord.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill={isHovered ? "#0f172a" : "#64748b"}
                  fontSize="10"
                  fontWeight={isHovered ? "800" : "600"}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Summary Insight */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>
          Period Invoiced:{" "}
          <strong className="text-slate-900 font-bold">
            {formatCurrency(totalInvoicedPeriod, "INR")}
          </strong>
        </span>
        <span>
          Period Collected:{" "}
          <strong className="text-emerald-700 font-bold">
            {formatCurrency(totalCollectedPeriod, "INR")}
          </strong>
        </span>
      </div>
    </div>
  );
}
