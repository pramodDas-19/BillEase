"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogService } from "@/services/service.service";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Package,
  Plus,
  Save,
  Tag,
  Check,
  Percent,
} from "lucide-react";

export default function NewServicePage() {
  const router = useRouter();

  // Dynamic Category state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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

  useEffect(() => {
    async function loadCategories() {
      try {
        const services = await CatalogService.getServices();
        const cats = Array.from(
          new Set(services.map((s) => s.category).filter(Boolean))
        ) as string[];
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        } else {
          setIsAddingCustomCategory(true);
        }
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

  const handleSaveCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (trimmed) {
      if (!categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
      setSelectedCategory(trimmed);
      setIsAddingCustomCategory(false);
      setCustomCategoryInput("");
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

  const handleSaveCustomUnit = () => {
    const trimmed = customUnitInput.trim();
    if (trimmed) {
      if (!units.includes(trimmed)) {
        setUnits((prev) => [...prev, trimmed]);
      }
      setSelectedUnit(trimmed);
      setIsAddingCustomUnit(false);
      setCustomUnitInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const categoryToSave = isAddingCustomCategory
      ? customCategoryInput.trim() || selectedCategory || "General"
      : selectedCategory || "General";

    try {
      await CatalogService.createService({
        name: serviceName,
        category: categoryToSave,
        rate: parseFloat(defaultRate) || 0,
        unit: isAddingCustomUnit ? customUnitInput.trim() || selectedUnit : selectedUnit,
        hsnSac: hsnCode || undefined,
        gstRate: parseFloat(taxRate) || 18,
        description: description || undefined,
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
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Website Design, Consultation, Banner Print"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
          </div>
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
                  onClick={() => setIsAddingCustomCategory(true)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  + Add Custom Category
                </button>
              )}
            </div>

            {isAddingCustomCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type new category..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  autoFocus
                  required={categories.length === 0}
                  className="w-full rounded-xl border border-emerald-500 bg-white px-4 py-2 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none shadow-2xs"
                />
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                )}
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
                  + Add Custom Category...
                </option>
              </select>
            )}
          </div>

          {/* Unit (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Unit of Measure</span>
                <span className="text-[10px] text-slate-400 font-medium lowercase">(optional)</span>
              </label>
              {!isAddingCustomUnit && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomUnit(true)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  + Add Unit
                </button>
              )}
            </div>

            {isAddingCustomUnit ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Kg, Bundle, Roll..."
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-emerald-500 bg-white px-4 py-2 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setIsAddingCustomUnit(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 cursor-pointer font-bold"
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
                <option value="">None (Flat / Lump sum)</option>
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
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* HSN / SAC Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>HSN / SAC Code</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 998311"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
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
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Link href="/services">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving Service..." : "Save Service Item"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
