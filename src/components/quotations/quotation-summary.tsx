"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { CurrencyCode, TaxBreakdown } from "@/types";
import { DEFAULT_DOCUMENT_CONFIG } from "@/config/document.config";

interface QuotationSummaryProps {
  subtotal: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  onDiscountChange?: (type: "percentage" | "fixed" | undefined, value: number) => void;
  isTaxEnabled: boolean;
  onTaxToggle?: (enabled: boolean) => void;
  taxRate: number;
  onTaxRateChange?: (rate: number) => void;
  taxBreakdown?: TaxBreakdown[];
  totalTax: number;
  totalAmount: number;
  currency: CurrencyCode;
}

export function QuotationSummary({
  subtotal,
  discountType,
  discountValue = 0,
  discountAmount = 0,
  onDiscountChange,
  isTaxEnabled,
  onTaxToggle,
  taxRate,
  onTaxRateChange,
  totalTax,
  totalAmount,
  currency,
}: QuotationSummaryProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4 max-w-md ml-auto">
      <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
        Summary & Calculations
      </h4>

      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-medium text-slate-900">{formatCurrency(subtotal, currency)}</span>
      </div>

      {/* Discount Configuration */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Discount (Optional)</span>
          {discountAmount > 0 && (
            <span className="font-medium text-rose-600">
              -{formatCurrency(discountAmount, currency)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={discountType || "none"}
            onChange={(e) => {
              const val = e.target.value;
              if (onDiscountChange) {
                onDiscountChange(
                  val === "none" ? undefined : (val as "percentage" | "fixed"),
                  discountValue
                );
              }
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="none">No Discount</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          {discountType && (
            <input
              type="number"
              min="0"
              placeholder={discountType === "percentage" ? "10%" : "500"}
              value={discountValue || ""}
              onChange={(e) => {
                if (onDiscountChange) {
                  onDiscountChange(discountType, Number(e.target.value) || 0);
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* GST / Tax (OPTIONAL) */}
      <div className="border-t border-slate-200 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTaxEnabled}
              onChange={(e) => onTaxToggle && onTaxToggle(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="text-xs font-semibold text-slate-700">Apply GST / Tax</span>
          </label>
          {isTaxEnabled && (
            <span className="text-xs font-medium text-slate-900">
              +{formatCurrency(totalTax, currency)}
            </span>
          )}
        </div>

        {isTaxEnabled && (
          <div className="pt-1">
            <select
              value={taxRate}
              onChange={(e) => onTaxRateChange && onTaxRateChange(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {DEFAULT_DOCUMENT_CONFIG.taxRates.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
        <span className="text-base font-bold text-slate-900">Total Amount</span>
        <span className="text-xl font-extrabold text-emerald-700">
          {formatCurrency(totalAmount, currency)}
        </span>
      </div>
    </div>
  );
}
