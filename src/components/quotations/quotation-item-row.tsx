"use client";

import React, { useState, useEffect, useRef } from "react";
import { QuotationLineItem } from "@/types";
import { CatalogService } from "@/services/service.service";
import { ProductOrService } from "@/types/service.types";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  Check,
  Search,
} from "lucide-react";

interface QuotationItemRowProps {
  item: QuotationLineItem;
  index: number;
  onUpdate: (id: string, updates: Partial<QuotationLineItem>) => void;
  onRemove: (id: string) => void;
  isRemovable: boolean;
  availableServices?: ProductOrService[];
}

export function QuotationItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  isRemovable,
  availableServices,
}: QuotationItemRowProps) {
  const [showDetails, setShowDetails] = useState(Boolean(item.detailedNotes || item.hsnSacCode));
  const [catalog, setCatalog] = useState<ProductOrService[]>(availableServices || []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (availableServices && availableServices.length > 0) {
      setCatalog(availableServices);
    } else {
      CatalogService.getServices().then((data) => {
        if (data && data.length > 0) setCatalog(data);
      });
    }
  }, [availableServices]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter catalog items by current description input
  const searchFilter = (item.description || "").toLowerCase().trim();
  const suggestions = catalog.filter(
    (s) =>
      !searchFilter ||
      s.name.toLowerCase().includes(searchFilter) ||
      (s.category && s.category.toLowerCase().includes(searchFilter))
  );

  const handleSelectService = (service: ProductOrService) => {
    const rate = service.rate ?? service.defaultRate ?? 0;
    const unit = service.unit || service.defaultUnit || "Unit";
    const qty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
    const computedAmount = rate > 0 ? qty * rate : (item.amount || 0);
    const hsn = service.hsnSacCode || service.hsnSac;

    onUpdate(item.id, {
      description: service.name,
      rate: rate > 0 ? rate : undefined,
      unit: unit || undefined,
      quantity: qty,
      amount: computedAmount,
      detailedNotes: service.description || item.detailedNotes || "",
      hsnSacCode: hsn || item.hsnSacCode || undefined,
    });

    if (hsn || service.description) {
      setShowDetails(true);
    }

    setIsDropdownOpen(false);
  };


  const handleQtyChange = (newQtyStr: string) => {
    const newQty = newQtyStr === "" ? undefined : Number(newQtyStr);
    const rate = item.rate;
    let newAmount = item.amount;

    if (newQty !== undefined && rate !== undefined && rate > 0) {
      newAmount = newQty * rate;
    }

    onUpdate(item.id, {
      quantity: newQty,
      amount: newAmount,
    });
  };

  const handleRateChange = (newRateStr: string) => {
    const newRate = newRateStr === "" ? undefined : Number(newRateStr);
    const qty = item.quantity;
    let newAmount = item.amount;

    if (newRate !== undefined && qty !== undefined && qty > 0) {
      newAmount = qty * newRate;
    } else if (newRate !== undefined && (!qty || qty === 0)) {
      newAmount = newRate;
    }

    onUpdate(item.id, {
      rate: newRate,
      amount: newAmount,
    });
  };

  return (
    <div
      className={cn(
        "clay-card rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300 relative",
        isDropdownOpen ? "z-40 ring-1 ring-emerald-500/20" : "z-10"
      )}
    >
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Line item index & Description with Smart Autocomplete */}
        <div className="col-span-12 lg:col-span-6 space-y-1.5 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              Item {index + 1} Description <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {/* Browse Catalog Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/70 shadow-2xs hover:bg-emerald-100 transition-colors"
              >
                <Package className="h-3 w-3 text-emerald-600" />
                <span>Catalog</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                {showDetails ? (
                  <>
                    Less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    + Specs <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Type custom item or pick from catalog..."
              value={item.description}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                onUpdate(item.id, { description: e.target.value });
                setIsDropdownOpen(true);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
            />
          </div>

          {/* Autocomplete Suggestions Popup with Polished Elevation & Slim Scrollbar */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute left-0 w-full sm:w-[130%] min-w-[320px] max-w-[480px] top-full mt-2 z-50 rounded-2xl bg-white p-2 border border-slate-200 shadow-2xl animate-in fade-in-50 zoom-in-95 backdrop-blur-md">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                <span>Saved Services ({suggestions.length})</span>
                <span className="text-emerald-700 font-semibold lowercase">click to auto-fill</span>
              </div>

              {/* Custom Scrollable List with Smooth Padding */}
              <div className="space-y-1 pt-1.5 max-h-64 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                {suggestions.map((srv) => {
                  const rate = srv.rate ?? srv.defaultRate ?? 0;
                  const unit = srv.unit || srv.defaultUnit || "Unit";

                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectService(srv)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-emerald-50/80 hover:text-emerald-950 transition-all group cursor-pointer border border-transparent hover:border-emerald-200/60"
                    >
                      <div className="overflow-hidden pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                            {srv.name}
                          </span>
                          <span className="clay-tag px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {srv.category}
                          </span>
                        </div>
                        {srv.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800">
                          {rate > 0 ? formatCurrency(rate, "INR") : "Custom"}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          /{unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showDetails && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-3">
                <textarea
                  rows={2}
                  placeholder="Add detailed specifications, paper GSM, dimensions, deliverables..."
                  value={item.detailedNotes || ""}
                  onChange={(e) => onUpdate(item.id, { detailedNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                />
              </div>
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  HSN / SAC <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9983"
                  value={item.hsnSacCode || ""}
                  onChange={(e) => onUpdate(item.id, { hsnSacCode: e.target.value.trim() })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                />
              </div>
            </div>
          )}

        </div>

        {/* Optional Quantity */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Qty (Optional)</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={item.quantity !== undefined ? item.quantity : ""}
            onChange={(e) => handleQtyChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Optional Rate */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Rate ₹ (Optional)</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={item.rate !== undefined ? item.rate : ""}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Line Amount (Mandatory) & Actions */}
        <div className="col-span-4 sm:col-span-6 lg:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">Amount ₹ *</label>
            {isRemovable && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right"
          />
        </div>
      </div>
    </div>
  );
}
