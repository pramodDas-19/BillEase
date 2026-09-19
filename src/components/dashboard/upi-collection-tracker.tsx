"use client";

import React, { useState, useEffect, useRef } from "react";
import { Payment } from "@/types";
import { PaymentService } from "@/services/payment.service";
import { useTenant } from "@/hooks/use-tenant";
import { formatCurrency, cn } from "@/lib/utils";
import { calculateUpiTrackerStats, UpiTrackerStats } from "@/lib/upi-tracker";
import { QrCode, Info, RefreshCw, AlertCircle } from "lucide-react";

export interface UpiCollectionTrackerProps {
  /** Optional pre-fetched payments to avoid duplicate network requests on the dashboard */
  payments?: Payment[];
  /** Optional external loading indicator */
  isLoading?: boolean;
  /** Optional external error */
  error?: Error | null;
  /** Optional external retry handler */
  onRetry?: () => void;
  className?: string;
}

export function UpiCollectionTracker({
  payments: externalPayments,
  isLoading: externalIsLoading,
  error: externalError,
  onRetry: externalOnRetry,
  className,
}: UpiCollectionTrackerProps) {
  const { currentTenant } = useTenant();

  // Internal state when used in standalone mode
  const [internalPayments, setInternalPayments] = useState<Payment[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(externalPayments === undefined);
  const [internalError, setInternalError] = useState<Error | null>(null);

  // Tooltip popover toggle (for touch/click accessibility)
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isControlled = externalPayments !== undefined;
  const isLoading = isControlled ? Boolean(externalIsLoading) : internalIsLoading;
  const error = isControlled ? externalError : internalError;
  const paymentsList = isControlled ? externalPayments : internalPayments;

  const fetchPayments = async () => {
    setInternalIsLoading(true);
    setInternalError(null);
    try {
      const data = await PaymentService.getPayments();
      setInternalPayments(data || []);
    } catch (err: any) {
      console.warn("UpiCollectionTracker fetch error:", err);
      setInternalError(err instanceof Error ? err : new Error("Unable to load UPI collections"));
    } finally {
      setInternalIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isControlled) {
      fetchPayments();
    }
  }, [isControlled, currentTenant?.id]);

  // Handle outside click to close tooltip on mobile
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTooltip]);

  const handleRetry = () => {
    if (externalOnRetry) {
      externalOnRetry();
    } else {
      fetchPayments();
    }
  };

  // 1. Loading State: Skeleton matching exact full-width card layout
  if (isLoading) {
    return (
      <div
        className={cn(
          "clay-card p-5 sm:p-6 relative overflow-hidden bg-slate-50/50 animate-pulse border border-slate-200/80 w-full",
          className
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-slate-200 rounded-xl" />
              <div className="h-3 w-36 bg-slate-200 rounded-md" />
            </div>
            <div className="h-8 w-52 bg-slate-200 rounded-lg" />
            <div className="h-4 w-44 bg-slate-200 rounded-full" />
          </div>
          <div className="flex-1 lg:max-w-xl xl:max-w-2xl space-y-2.5 lg:pl-6 lg:border-l lg:border-slate-200/60">
            <div className="flex justify-between">
              <div className="h-3 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full" />
            <div className="h-2.5 w-52 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State: Compact non-zero recovery state
  if (error) {
    return (
      <div
        className={cn(
          "clay-card p-5 sm:p-6 relative overflow-hidden bg-rose-50/30 border border-rose-200/80 w-full",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Unable to load UPI collections</p>
              <p className="text-xs text-slate-500">Please check your network connection and try again.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Normal / Active Calculation
  const stats: UpiTrackerStats = calculateUpiTrackerStats(
    paymentsList || [],
    currentTenant?.id,
    new Date()
  );

  return (
    <div
      className={cn(
        "clay-card p-5 sm:p-6 relative overflow-hidden group bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/20 border border-slate-200/80 transition-all duration-200 w-full",
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
        {/* Left Block: Identity, Amount & Status Pill */}
        <div className="space-y-2 shrink-0">
          <div className="flex items-center gap-2 relative" ref={tooltipRef}>
            <div className="clay-icon-squircle p-1.5 shrink-0 bg-[#0C9484]/10 text-[#0C9484] border border-[#0C9484]/20">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              UPI Collection Tracker
            </span>
            <button
              type="button"
              aria-label="UPI Tracker Information"
              aria-expanded={showTooltip}
              onClick={() => setShowTooltip((prev) => !prev)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-700 focus:outline-hidden p-0.5 rounded cursor-pointer transition-colors"
            >
              <Info className="h-3.5 w-3.5 text-slate-400 hover:text-[#0C9484] transition-colors" />
            </button>

            {/* Accessible Information Tooltip */}
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute left-0 top-full mt-1.5 z-40 w-72 p-3 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-800 animate-in fade-in-50 zoom-in-95 pointer-events-auto"
              >
                <p>
                  This tracker is informational and uses only UPI payments recorded in BillEase. Actual
                  MDR treatment depends on your bank, payment provider, transaction type, and merchant
                  classification.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900">
              {formatCurrency(stats.upiCollected, "INR")}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              of {formatCurrency(stats.threshold, "INR")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", stats.statusDotColor)} />
            <span className="text-xs font-bold text-slate-700">{stats.statusText}</span>
          </div>
        </div>

        {/* Right Block: Wide Progress Bar & Reference Threshold Details */}
        <div className="flex-1 lg:max-w-xl xl:max-w-2xl flex flex-col justify-center space-y-2 lg:pl-6 lg:border-l lg:border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              <strong className="text-slate-900 font-bold">{stats.percentage}%</strong> of monthly reference threshold
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Ref Limit: ₹1,00,000 / month
            </span>
          </div>

          {/* Progress Bar Container: Clamped strictly inside card */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 shadow-inner">
            <div
              role="progressbar"
              aria-valuenow={stats.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Monthly UPI collection progress against ₹1 lakh threshold"
              className="h-full rounded-full transition-all duration-500 ease-out bg-[#0C9484]"
              style={{ width: `${stats.clampedPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
            <span>Based on UPI payments recorded in BillEase.</span>
            <span className="font-semibold text-slate-500">
              {stats.validPaymentsCount} {stats.validPaymentsCount === 1 ? "receipt" : "receipts"} this month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
