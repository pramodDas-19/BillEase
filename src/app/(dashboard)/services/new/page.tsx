"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogService } from "@/services/service.service";
import { validateService, STANDARD_GST_SLABS } from "@/validations/service.schema";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Save,
  AlertCircle,
} from "lucide-react";

const STANDARD_CATEGORIES = [
  "Standard Services",
  "Physical Products / Goods",
  "Consulting & Advisory",
  "Design & Creative",
  "Technical / Development",
  "Maintenance & Repair",
  "General",
];

export default function NewServicePage() {
  const router = useRouter();

  // Dynamic Category state
  const [categories, setCategories] = useState<string[]>(STANDARD_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(STANDARD_CATEGORIES[0]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>("");

  // Dynamic Unit state
  const [units, setUnits] = useState<string[]>([
    "Pcs",
    "Units",
    "Hours",
    "Days",
    "Sq Ft",
    "Sets",
    "Package",
    "Month",
  ]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [isAddingCustomUnit, setIsAddingCustomUnit] = useState<boolean>(false);
  const [customUnitInput, setCustomUnitInput] = useState<string>("");

  // Form fields
  const [serviceName, setServiceName] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCategories() {
      try {
        const services = await CatalogService.getServices();
        const existingCats = services.map((s) => s.category).filter(Boolean);
        const merged = Array.from(new Set([...STANDARD_CATEGORIES, ...existingCats])) as string[];
        setCategories(merged);
      } catch (err) {
        console.warn("Could not load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const handleCategoryChange = (val: string) => {
    if (val === "__ADD_NEW__") {
      setIsAddingCustomCategory(true);
      setCustomCategoryInput("");
    } else {
      setSelectedCategory(val);
      setIsAddingCustomCategory(false);
    }
  };

  const handleUnitChange = (val: string) => {
    if (val === "__ADD_NEW_UNIT__") {
      setIsAddingCustomUnit(true);
      setCustomUnitInput("");
    } else {
      setSelectedUnit(val);
      setIsAddingCustomUnit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryToSave = isAddingCustomCategory
      ? customCategoryInput.trim() || selectedCategory || "General"
      : selectedCategory || "General";

    const parsedRate = parseFloat(defaultRate);
    const parsedTax = parseFloat(taxRate);

    // Formal Schema Validation
    const errors = validateService({
      name: serviceName,
      category: categoryToSave,
      rate: isNaN(parsedRate) ? 0 : parsedRate,
      gstRate: isNaN(parsedTax) ? 0 : parsedTax,
      hsnSac: hsnCode,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      await CatalogService.createService({
        name: serviceName.trim(),
        category: categoryToSave,
        rate: isNaN(parsedRate) ? 0 : parsedRate,
        unit: isAddingCustomUnit ? customUnitInput.trim() : (selectedUnit || ""),
        hsnSac: hsnCode.trim() || undefined,
        gstRate: isNaN(parsedTax) ? 0 : parsedTax,
        description: description.trim() || undefined,
        isActive: true,
      });

      router.push("/services");
    } catch (err) {
      console.error("Failed to create service:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Add New Service or Item
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Save your services, products, and standard pricing for fast 1-click invoice line items.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="clay-card p-6 sm:p-8 space-y-6">
        {/* Service Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Item / Service Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Website Design, Consultation, Banner Print"
            value={serviceName}
            onChange={(e) => {
              setServiceName(e.target.value);
              if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
            }}
            required
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
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

        {/* Dynamic Category & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Dynamic Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              {!isAddingCustomCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomCategory(true);
                    setCustomCategoryInput("");
                  }}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  + Add Custom Category
                </button>
              )}
            </div>

            {isAddingCustomCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 px-4 py-2 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomCategory(false);
                    setCustomCategoryInput("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="font-bold text-emerald-600">
                  + Add New Category...
                </option>
              </select>
            )}
          </div>

          {/* Dynamic Unit of Measure */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Unit of Measure
              </label>
              {!isAddingCustomUnit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomUnit(true);
                    setCustomUnitInput("");
                  }}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  + Add Custom Unit
                </button>
              )}
            </div>

            {isAddingCustomUnit ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Session, Box, Roll"
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 px-4 py-2 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomUnit(false);
                    setCustomUnitInput("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={selectedUnit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
              >
                <option value="">None (Flat Rate)</option>
                {units.map((u) => (
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

        {/* Rate, HSN, Tax */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Standard Rate (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={defaultRate}
              onChange={(e) => {
                setDefaultRate(e.target.value);
                if (formErrors.rate) setFormErrors((prev) => ({ ...prev, rate: "" }));
              }}
              required
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
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

          {/* HSN / SAC Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>HSN / SAC Code</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 998311"
              value={hsnCode}
              onChange={(e) => {
                setHsnCode(e.target.value);
                if (formErrors.hsnSac) setFormErrors((prev) => ({ ...prev, hsnSac: "" }));
              }}
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
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

          {/* GST Tax Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              GST Rate (%) <span className="text-rose-500">*</span>
            </label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
            >
              <option value="0">0% (Exempt)</option>
              <option value="5">5% (Essential)</option>
              <option value="12">12% (Standard Low)</option>
              <option value="18">18% (Standard Services)</option>
              <option value="28">28% (Luxury / High)</option>
            </select>
          </div>
        </div>

        {/* Quick Indian GST Slabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick GST Slabs:</span>
          {STANDARD_GST_SLABS.map((slab) => (
            <button
              key={slab}
              type="button"
              onClick={() => setTaxRate(slab.toString())}
              className={cn(
                "clay-tag px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                taxRate === slab.toString()
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {slab}%
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Description / Notes</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <textarea
            rows={3}
            placeholder="Detailed description of what is included in this item or service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs resize-none"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-5 border-t border-slate-100">
          <Link href="/services" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto clay-btn-emerald inline-flex items-center justify-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving Service..." : "Save Service Item"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
