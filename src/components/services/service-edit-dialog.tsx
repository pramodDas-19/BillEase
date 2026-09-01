"use client";

import React, { useState, useEffect } from "react";
import { ServiceItem } from "@/types";
import { CatalogService } from "@/services/service.service";
import { X, Save, Edit3, Plus, IndianRupee } from "lucide-react";

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

export function ServiceEditDialog({
  isOpen,
  onClose,
  service,
  onServiceUpdated,
}: ServiceEditDialogProps) {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
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

  useEffect(() => {
    async function loadAllCategories() {
      try {
        const allServices = await CatalogService.getServices();
        const cats = Array.from(
          new Set(allServices.map((s) => s.category).filter(Boolean))
        ) as string[];
        setCategories(cats);
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
    setIsSaving(true);

    const parsedRate = parseFloat(rate);
    const parsedGst = parseFloat(gstRate);
    const finalCategory = (isCustomCategory ? customCategoryInput.trim() : category.trim()) || "General";
    const finalUnit = isCustomUnit ? customUnitInput.trim() : unit.trim();

    try {
      const updated = await CatalogService.updateService(service.id, {
        name,
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
          name,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="clay-card w-full max-w-xl bg-white p-7 sm:p-8 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-2xl">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Edit Item / Service
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update catalog pricing, category, unit of measure, and tax details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          {/* Row 1: Item / Service Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Item / Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graphic Design, Banner Print, Consultation"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
          </div>

          {/* Row 2: Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category
                </label>
                {!isCustomCategory && (
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(true)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Custom</span>
                  </button>
                )}
              </div>

              {isCustomCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Type category..."
                    autoFocus
                    className="w-full rounded-xl border border-emerald-500 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__ADD_NEW_CATEGORY__" className="font-bold text-emerald-600">
                    + Add Custom Category...
                  </option>
                </select>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <span>Unit</span>
                  <span className="text-[10px] text-slate-400 font-medium lowercase">(optional)</span>
                </label>
                {!isCustomUnit && (
                  <button
                    type="button"
                    onClick={() => setIsCustomUnit(true)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Custom</span>
                  </button>
                )}
              </div>

              {isCustomUnit ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customUnitInput}
                    onChange={(e) => setCustomUnitInput(e.target.value)}
                    placeholder="e.g. Roll, Kg"
                    autoFocus
                    className="w-full rounded-xl border border-emerald-500 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomUnit(false)}
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
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>
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
                onChange={(e) => setHsnSac(e.target.value)}
                placeholder="e.g. 998311"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
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

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="clay-btn-emerald inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
