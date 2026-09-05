"use client";

import React, { useState, useEffect, useRef } from "react";
import { QuotationLineItem, CurrencyCode } from "@/types";
import { CatalogService } from "@/services/service.service";
import { ProductOrService } from "@/types/service.types";
import { formatCurrency, cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/constants/currencies";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  Check,
  Search,
  Plus,
  Loader2,
} from "lucide-react";

const COMMON_UNITS = [
  "Pcs",
  "Mtr",
  "Sq.ft",
  "Kg",
  "Nos",
  "Hrs",
  "Box",
  "Set",
  "Ltr",
  "Roll",
  "Pkts",
  "Days",
];

interface QuotationItemRowProps {
  item: QuotationLineItem;
  index: number;
  onUpdate: (id: string, updates: Partial<QuotationLineItem>) => void;
  onRemove: (id: string) => void;
  isRemovable: boolean;
  availableServices?: ProductOrService[];
  currency?: CurrencyCode;
}

export function QuotationItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  isRemovable,
  availableServices,
  currency = "INR",
}: QuotationItemRowProps) {
  const sym = getCurrencySymbol(currency);
  const [showDetails, setShowDetails] = useState(Boolean(item.detailedNotes || item.hsnSacCode));
  const [catalog, setCatalog] = useState<ProductOrService[]>(availableServices || []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(Boolean(item.unit && !COMMON_UNITS.includes(item.unit)));
  const [isSavingToCatalog, setIsSavingToCatalog] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
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
  const isExistingInCatalog = catalog.some(
    (s) => s.name.toLowerCase().trim() === searchFilter
  );
  const suggestions = catalog.filter(
    (s) =>
      !searchFilter ||
      s.name.toLowerCase().includes(searchFilter) ||
      (s.category && s.category.toLowerCase().includes(searchFilter))
  );

  const handleSaveToCatalog = async () => {
    if (!item.description.trim()) return;
    setIsSavingToCatalog(true);
    try {
      const newService = await CatalogService.createService({
        name: item.description.trim(),
        rate: item.rate || 0,
        unit: item.unit || "Unit",
        gstRate: item.taxRate !== undefined ? item.taxRate : 18,
        description: item.detailedNotes || undefined,
        hsnSac: item.hsnSacCode || undefined,
        category: "General",
      });
      if (newService) {
        setCatalog((prev) => [newService, ...prev]);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save service to catalog:", err);
    } finally {
      setIsSavingToCatalog(false);
    }
  };

  const handleSelectService = (service: ProductOrService) => {
    const rate = service.rate ?? service.defaultRate ?? 0;
    const unit = service.unit || service.defaultUnit || "Unit";
    const qty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
    const computedAmount = rate > 0 ? qty * rate : (item.amount || 0);
    const hsn = service.hsnSacCode || service.hsnSac;
    const gstRate = service.gstRate !== undefined ? service.gstRate : (service.defaultTaxRate !== undefined ? service.defaultTaxRate : 18);

    onUpdate(item.id, {
      description: service.name,
      rate: rate > 0 ? rate : undefined,
      unit: unit || undefined,
      quantity: qty,
      amount: computedAmount,
      detailedNotes: service.description || item.detailedNotes || "",
      hsnSacCode: hsn || item.hsnSacCode || undefined,
      taxRate: gstRate,
    });

    if (hsn || service.description) {
      setShowDetails(true);
    }

    setIsDropdownOpen(false);
  };


  const getPreDiscountBase = (
    qty = item.quantity,
    rate = item.rate,
    currentAmt = item.amount,
    currentDiscAmt = item.discountAmount
  ) => {
    if (qty !== undefined && qty > 0 && rate !== undefined && rate > 0) {
      return Math.round(Number(qty) * Number(rate) * 100) / 100;
    }
    if (rate !== undefined && rate > 0) {
      const q = qty !== undefined && qty > 0 ? Number(qty) : 1;
      return Math.round(q * Number(rate) * 100) / 100;
    }
    // If rate is missing or 0, base is derived from current amount + deducted discount
    const gross = (Number(currentAmt) || 0) + (Number(currentDiscAmt) || 0);
    return Math.max(0, gross);
  };

  const computeLineAmount = (
    qty = item.quantity,
    rate = item.rate,
    discType: "percentage" | "fixed" = item.discountType || "percentage",
    discVal = item.discountValue || 0,
    currentAmt = item.amount
  ) => {
    const base = getPreDiscountBase(qty, rate, currentAmt, item.discountAmount);

    let effectiveType: "percentage" | "fixed" = discType;
    let effectiveVal = Number(discVal) || 0;

    // Smart UX: If user entered > 100 in percentage mode (e.g. 2000),
    // they clearly intended a currency amount (₹2000), not an impossible 2000% discount
    if (effectiveType === "percentage" && effectiveVal > 100) {
      effectiveType = "fixed";
    }

    let discAmount = 0;
    if (effectiveVal > 0 && base > 0) {
      if (effectiveType === "percentage") {
        const cappedPct = Math.min(100, Math.max(0, effectiveVal));
        discAmount = Math.round(((base * cappedPct) / 100) * 100) / 100;
      } else {
        discAmount = Math.min(base, effectiveVal);
      }
    }

    const finalAmount = Math.max(0, Math.round((base - discAmount) * 100) / 100);
    return {
      amount: finalAmount > 0 ? finalAmount : (item.amount || 0),
      discountAmount: discAmount > 0 ? discAmount : undefined,
      discountType: effectiveType,
      discountValue: effectiveVal,
    };
  };

  const handleQtyChange = (newQtyStr: string) => {
    const newQty = newQtyStr === "" ? undefined : Number(newQtyStr);
    const { amount, discountAmount } = computeLineAmount(newQty, item.rate, item.discountType, item.discountValue);
    onUpdate(item.id, {
      quantity: newQty,
      amount,
      discountAmount,
    });
  };

  const handleRateChange = (newRateStr: string) => {
    const newRate = newRateStr === "" ? undefined : Number(newRateStr);
    const { amount, discountAmount } = computeLineAmount(item.quantity, newRate, item.discountType, item.discountValue);
    onUpdate(item.id, {
      rate: newRate,
      amount,
      discountAmount,
    });
  };

  const handleDiscountChange = (newDiscStr: string) => {
    const newDiscVal = newDiscStr === "" ? 0 : Number(newDiscStr);
    const { amount, discountAmount, discountType } = computeLineAmount(
      item.quantity,
      item.rate,
      item.discountType || "percentage",
      newDiscVal
    );
    onUpdate(item.id, {
      discountValue: newDiscVal,
      discountType,
      amount,
      discountAmount,
    });
  };

  const handleDiscountTypeChange = (newDiscType: "percentage" | "fixed") => {
    const { amount, discountAmount } = computeLineAmount(
      item.quantity,
      item.rate,
      newDiscType,
      item.discountValue
    );
    onUpdate(item.id, {
      discountType: newDiscType,
      amount,
      discountAmount,
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md relative",
        isDropdownOpen ? "z-40 ring-2 ring-emerald-500/20 shadow-lg" : "z-10"
      )}
    >
      {/* ========================================================================= */}
      {/* ROW 1: ITEM IDENTITY (Full Width Description) & TOTAL AMOUNT              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 pb-4 border-b border-slate-100">
        {/* Left: Description & Catalog Auto-suggest */}
        <div className="flex-1 min-w-0 space-y-1.5 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-5 w-6 rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-700 border border-slate-200">
                #{index + 1}
              </span>
              <label className="text-xs font-bold text-slate-800">
                Item / Service Description <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {/* Browse Catalog Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs transition-colors"
              >
                <Package className="h-3 w-3 text-emerald-600" />
                <span>Catalog</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </button>

              {/* Specs & Notes Toggle */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
              >
                {showDetails ? (
                  <>
                    Hide Notes <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    + Notes / HSN <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Type custom service / product or pick from catalog..."
              value={item.description}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                onUpdate(item.id, { description: e.target.value });
                setIsDropdownOpen(true);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
            />
          </div>

          {/* Autocomplete Suggestions Popup */}
          {isDropdownOpen && (suggestions.length > 0 || (searchFilter && !isExistingInCatalog)) && (
            <div className="absolute left-0 w-full sm:w-[130%] min-w-[320px] max-w-[500px] top-full mt-2 z-50 rounded-2xl bg-white p-2.5 border border-slate-200 shadow-2xl animate-in fade-in-50 zoom-in-95 backdrop-blur-md">
              {/* 1-Click Save to Catalog Banner when typing a new item */}
              {searchFilter && !isExistingInCatalog && (
                <div className="p-2.5 mb-2 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Save &ldquo;{item.description}&rdquo;
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Add to Services Catalog for future quotes & bills
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSavingToCatalog || savedSuccess}
                    onClick={handleSaveToCatalog}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isSavingToCatalog ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : savedSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Save</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {suggestions.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <span>Catalog Items ({suggestions.length})</span>
                    <span>Rate & GST</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pt-1.5 custom-scrollbar">
                    {suggestions.map((srv) => {
                      const rate = srv.rate ?? srv.defaultRate ?? 0;
                      const unit = srv.unit || srv.defaultUnit || "Unit";
                      const gst = srv.gstRate !== undefined ? srv.gstRate : (srv.defaultTaxRate !== undefined ? srv.defaultTaxRate : 18);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => handleSelectService(srv)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/60 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                                {srv.name}
                              </span>
                              <span className="clay-tag px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                {srv.category}
                              </span>
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 rounded">
                                GST {gst}%
                              </span>
                            </div>
                            {srv.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                                {srv.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-xs text-slate-900">
                              {rate > 0 ? formatCurrency(rate, currency) : "—"}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium">/{unit}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Amount & Actions */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0 sm:pl-3">
          <div className="flex items-center gap-2 w-full justify-end">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Amount ({sym}) <span className="text-rose-500">*</span>
            </label>
            {isRemovable && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                title="Remove Item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="w-36 sm:w-44">
            <input
              type="number"
              min="0"
              step="any"
              required
              placeholder="0.00"
              value={item.amount && item.amount > 0 ? item.amount : ""}
              onChange={(e) => {
                const valStr = e.target.value;
                if (valStr === "") {
                  onUpdate(item.id, { amount: 0, discountAmount: undefined });
                  return;
                }
                const newGross = Number(valStr) || 0;
                const { amount, discountAmount } = computeLineAmount(
                  item.quantity,
                  item.rate,
                  item.discountType,
                  item.discountValue,
                  newGross
                );
                onUpdate(item.id, { amount, discountAmount });
              }}
              className="w-full text-right rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2 text-base font-mono font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: QUANTITATIVE PRICING DRIVERS (4 Spacious Columns)                  */}
      {/* ========================================================================= */}
      <div className="pt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-start">
        {/* Col 1: Quantity & Unit */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600">Qty & Unit</label>
            {item.unit && (
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded">
                {item.unit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="1"
              value={item.quantity !== undefined ? item.quantity : ""}
              onChange={(e) => handleQtyChange(e.target.value)}
              className="w-1/2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
            <select
              value={COMMON_UNITS.includes(item.unit || "") ? item.unit : item.unit ? "custom" : ""}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomUnit(true);
                } else {
                  setIsCustomUnit(false);
                  onUpdate(item.id, { unit: e.target.value || undefined });
                }
              }}
              className="w-1/2 rounded-xl border border-slate-200 bg-slate-50/90 px-1.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
            >
              <option value="">Unit</option>
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="custom">✏️ Custom...</option>
            </select>
          </div>
          {isCustomUnit && (
            <input
              type="text"
              placeholder="e.g. meter, bundle"
              value={item.unit || ""}
              onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
              className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
          )}
        </div>

        {/* Col 2: Unit Rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600">Unit Rate ({sym})</label>
            <span className="text-[10px] text-slate-400 font-medium">Optional</span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={item.rate !== undefined ? item.rate : ""}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>

        {/* Col 3: Item Discount */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600">Discount</label>
            {Boolean(item.discountValue && item.discountValue > 0) && (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded">
                -{sym}{item.discountAmount || 0}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={item.discountValue || ""}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className="w-2/3 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
            <select
              value={item.discountType || "percentage"}
              onChange={(e) => handleDiscountTypeChange(e.target.value as "percentage" | "fixed")}
              className="w-1/3 rounded-xl border border-slate-200 bg-slate-50/90 px-1 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none shadow-2xs"
            >
              <option value="percentage">%</option>
              <option value="fixed">{sym}</option>
            </select>
          </div>
        </div>

        {/* Col 4: GST % */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600">GST Slab</label>
          <select
            value={item.taxRate !== undefined ? item.taxRate : 18}
            onChange={(e) => onUpdate(item.id, { taxRate: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
          >
            <option value={18}>18% (Standard)</option>
            <option value={12}>12% (Goods)</option>
            <option value={5}>5% (Essential)</option>
            <option value={28}>28% (Luxury)</option>
            <option value={0}>0% (Exempt)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPTIONAL FULL-WIDTH DRAWER: SCOPE & HSN CODE                             */}
      {/* ========================================================================= */}
      {showDetails && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 animate-in fade-in-50 duration-150">
          <div className="sm:col-span-8 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Detailed Scope / Specifications <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add deliverables, paper GSM, dimensions, milestones, scope notes..."
              value={item.detailedNotes || ""}
              onChange={(e) => onUpdate(item.id, { detailedNotes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
          </div>
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              HSN / SAC Code <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 998311"
              value={item.hsnSacCode || ""}
              onChange={(e) => onUpdate(item.id, { hsnSacCode: e.target.value.trim() })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              Printed on official GST invoice document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
