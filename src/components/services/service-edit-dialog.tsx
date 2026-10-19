"use client";

import React, { useState, useEffect } from "react";
import { ServiceItem } from "@/types";
import { CatalogService } from "@/services/service.service";
import { validateService, STANDARD_GST_SLABS } from "@/validations/service.schema";
import { X, Save, Edit3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem | null;
  onServiceUpdated: (updatedService: ServiceItem) => void;
}

const DEFAULT_UNITS = [
  "Pcs",
  "Units",
  "Hours",
  "Days",
  "Sq Ft",
  "Sets",
  "Package",
  "Month",
];

const STANDARD_CATEGORIES = [
  "Standard Services",
  "Physical Products / Goods",
  "Consulting & Advisory",
  "Design & Creative",
  "Technical / Development",
  "Maintenance & Repair",
  "General",
];

export function ServiceEditDialog({
  isOpen,
  onClose,
  service,
  onServiceUpdated,
}: ServiceEditDialogProps) {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<string[]>(STANDARD_CATEGORIES);
  const [category, setCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState("");
  const [hsnSac, setHsnSac] = useState("");
  const [gstRate, setGstRate] = useState("0");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadAllCategories() {
      try {
        const allServices = await CatalogService.getServices();
        const existingCats = allServices.map((s) => s.category).filter(Boolean);
        const merged = Array.from(new Set([...STANDARD_CATEGORIES, ...existingCats])) as string[];
        setCategories(merged);
      } catch (err) {
        console.warn("Could not load categories in edit dialog:", err);
      }
    }
    loadAllCategories();
  }, []);

  useEffect(() => {
    if (service) {
      setName(service.name || "");

      const currentCat = service.category || "General";
      setCategory(currentCat);
      setIsCustomCategory(false);
      setCustomCategoryInput("");

      if (currentCat) {
        setCategories((prev) => (prev.includes(currentCat) ? prev : [currentCat, ...prev]));
      }

      const existingRate = service.rate !== undefined ? service.rate : (service.defaultRate ?? 0);
      setRate(existingRate.toString());

      const existingUnit = service.unit || service.defaultUnit || "";
      setUnit(existingUnit);
      if (existingUnit && !DEFAULT_UNITS.includes(existingUnit)) {
        setIsCustomUnit(true);
        setCustomUnitInput(existingUnit);
      } else {
        setIsCustomUnit(false);
        setCustomUnitInput("");
      }

      setHsnSac(service.hsnSac || service.hsnSacCode || "");
      const existingGst = service.gstRate !== undefined ? service.gstRate : (service.defaultTaxRate ?? 0);
      setGstRate(existingGst.toString());
      setDescription(service.description || "");
      setFormErrors({});
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const handleCategoryDropdownChange = (val: string) => {
    if (val === "__ADD_NEW_CATEGORY__") {
      setIsCustomCategory(true);
      setCustomCategoryInput("");
    } else {
      setCategory(val);
      setIsCustomCategory(false);
    }
  };

  const handleUnitDropdownChange = (val: string) => {
    if (val === "__ADD_NEW_UNIT__") {
      setIsCustomUnit(true);
      setCustomUnitInput("");
    } else {
      setUnit(val);
      setIsCustomUnit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedRate = parseFloat(rate);
    const parsedGst = parseFloat(gstRate);
    const finalCategory = (isCustomCategory ? customCategoryInput.trim() : category.trim()) || "General";
    const finalUnit = isCustomUnit ? customUnitInput.trim() : unit.trim();

    // Formal Schema Validation
    const errors = validateService({
      name,
      category: finalCategory,
      rate: isNaN(parsedRate) ? 0 : parsedRate,
      gstRate: isNaN(parsedGst) ? 0 : parsedGst,
      hsnSac,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const updated = await CatalogService.updateService(service.id, {
        name: name.trim(),
        category: finalCategory,
        rate: isNaN(parsedRate) ? 0 : parsedRate,
        unit: finalUnit,
        hsnSac: hsnSac.trim(),
        gstRate: isNaN(parsedGst) ? 0 : parsedGst,
        description: description.trim(),
      });

      if (updated) {
        onServiceUpdated(updated);
        onClose();
      } else {
        onServiceUpdated({
          ...service,
          name: name.trim(),
          category: finalCategory,
          rate: isNaN(parsedRate) ? 0 : parsedRate,
          unit: finalUnit,
          hsnSac: hsnSac.trim(),
          gstRate: isNaN(parsedGst) ? 0 : parsedGst,
          description: description.trim(),
        });
        onClose();
      }
    } catch (err) {
      console.error("Failed to update service:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="clay-card w-full max-w-xl bg-white shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-2xl shrink-0">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Edit Item / Service
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update catalog pricing, category, unit of measure, and tax details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Row 1: Item / Service Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Item / Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g. Graphic Design, Banner Print, Consultation"
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 shadow-2xs",
                formErrors.name
                  ? "border-rose-400 focus:ring-rose-400/20"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              )}
            />
            {formErrors.name && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{formErrors.name}</span>
              </p>
            )}
          </div>

          {/* Row 2: Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category
                </label>
                {!isCustomCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(true);
                      setCustomCategoryInput("");
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    + New
                  </button>
                )}
              </div>

              {isCustomCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 px-3.5 py-2 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCustomCategoryInput("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => handleCategoryDropdownChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__ADD_NEW_CATEGORY__" className="font-bold text-emerald-600">
                    + Add Custom Category...
                  </option>
                </select>
              )}
            </div>

            {/* Unit of Measure */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Unit of Measure
                </label>
                {!isCustomUnit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(true);
                      setCustomUnitInput("");
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    + Custom
                  </button>
                )}
              </div>

              {isCustomUnit ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={customUnitInput}
                    onChange={(e) => setCustomUnitInput(e.target.value)}
                    placeholder="e.g. Session, Box, Roll"
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 px-3.5 py-2 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      setCustomUnitInput("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => handleUnitDropdownChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="">None (Flat Rate)</option>
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="__ADD_NEW_UNIT__" className="font-bold text-emerald-600">
                    + Add Custom Unit...
                  </option>
                </select>
              )}
            </div>
          </div>

          {/* Row 3: Rate, HSN/SAC & GST Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Standard Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Rate (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  if (formErrors.rate) setFormErrors((prev) => ({ ...prev, rate: "" }));
                }}
                placeholder="0.00"
                className={cn(
                  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 shadow-2xs",
                  formErrors.rate
                    ? "border-rose-400 focus:ring-rose-400/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
              {formErrors.rate && (
                <p className="text-xs text-rose-500 font-medium mt-1">
                  {formErrors.rate}
                </p>
              )}
            </div>

            {/* GST Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                GST Rate
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            {/* HSN / SAC */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                HSN / SAC
              </label>
              <input
                type="text"
                value={hsnSac}
                onChange={(e) => {
                  setHsnSac(e.target.value);
                  if (formErrors.hsnSac) setFormErrors((prev) => ({ ...prev, hsnSac: "" }));
                }}
                placeholder="e.g. 998311"
                className={cn(
                  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 shadow-2xs",
                  formErrors.hsnSac
                    ? "border-rose-400 focus:ring-rose-400/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
              {formErrors.hsnSac && (
                <p className="text-xs text-rose-500 font-medium mt-1">
                  {formErrors.hsnSac}
                </p>
              )}
            </div>
          </div>

          {/* Quick GST Slabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick GST:</span>
            {STANDARD_GST_SLABS.map((slab) => (
              <button
                key={slab}
                type="button"
                onClick={() => setGstRate(slab.toString())}
                className={cn(
                  "clay-tag px-2.5 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer",
                  gstRate === slab.toString()
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {slab}%
              </button>
            ))}
          </div>

          {/* Row 4: Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Description / Notes</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item details, scope of work, material specs..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs resize-none"
            />
          </div>
        </form>

        {/* Sticky Mobile-Friendly Action Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-4 sm:p-5 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-2.5 min-h-[38px] text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 sm:flex-none clay-btn-emerald inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[38px] text-xs font-bold rounded-xl cursor-pointer shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
