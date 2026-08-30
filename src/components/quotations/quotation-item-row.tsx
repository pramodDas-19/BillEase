"use client";

import React, { useState } from "react";
import { QuotationLineItem } from "@/types";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { COMMON_UNITS } from "@/constants/service-categories";

interface QuotationItemRowProps {
  item: QuotationLineItem;
  index: number;
  onUpdate: (id: string, updates: Partial<QuotationLineItem>) => void;
  onRemove: (id: string) => void;
  isRemovable: boolean;
}

export function QuotationItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  isRemovable,
}: QuotationItemRowProps) {
  const [showDetails, setShowDetails] = useState(Boolean(item.detailedNotes));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300">
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Line item index & Description */}
        <div className="col-span-12 lg:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Item {index + 1} Description <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              {showDetails ? (
                <>
                  Less details <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  + Add specs / scope <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Stage lighting & trussing setup / 500 Visiting cards"
            value={item.description}
            onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {showDetails && (
            <textarea
              rows={2}
              placeholder="Add detailed specifications, paper GSM, dimensions, deliverables..."
              value={item.detailedNotes || ""}
              onChange={(e) => onUpdate(item.id, { detailedNotes: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-2"
            />
          )}
        </div>

        {/* Optional Quantity */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Qty (Optional)</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={item.quantity !== undefined ? item.quantity : ""}
            onChange={(e) =>
              onUpdate(item.id, {
                quantity: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Optional Unit & Rate */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Rate (Optional)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="—"
              value={item.rate !== undefined ? item.rate : ""}
              onChange={(e) =>
                onUpdate(item.id, {
                  rate: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Line Amount (Mandatory) & Actions */}
        <div className="col-span-4 sm:col-span-6 lg:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Amount *</label>
            {isRemovable && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Remove Item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={item.amount || ""}
            onChange={(e) => onUpdate(item.id, { amount: Number(e.target.value) || 0 })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
          />
        </div>
      </div>
    </div>
  );
}
