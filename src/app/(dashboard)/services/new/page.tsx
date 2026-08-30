"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogService } from "@/services/service.service";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  Check,
  Percent,
} from "lucide-react";

export default function NewServicePage() {
  const router = useRouter();

  // Category state with dynamic addition
  const [categories, setCategories] = useState<string[]>([
    "Event Management & Services",
    "Printing & Fabrication",
    "Graphic Design & Creative",
    "Sound, Light & AV Rentals",
    "Custom Fabrication",
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    "Event Management & Services"
  );
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>("");

  // Unit state with dynamic addition
  const [units, setUnits] = useState<string[]>([
    "Sq Ft",
    "Pcs",
    "Setup",
    "Per Day",
    "1000 Pcs",
    "Package",
    "Hour",
    "Sets",
  ]);
  const [selectedUnit, setSelectedUnit] = useState<string>("Setup");
  const [isAddingCustomUnit, setIsAddingCustomUnit] = useState<boolean>(false);
  const [customUnitInput, setCustomUnitInput] = useState<string>("");

  // Form fields
  const [serviceName, setServiceName] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [description, setDescription] = useState("");

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await CatalogService.createService({
        name: serviceName,
        category: selectedCategory,
        rate: parseFloat(defaultRate) || 0,
        unit: selectedUnit,
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
              Save standard items and pricing for fast autocompletion in quotes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="clay-card p-6 sm:p-8 space-y-6">
        {/* Service Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Service or Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. P3 Outdoor LED Screen or 350 GSM Brochure Print"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Dynamic / Creatable Category Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Category
            </label>
            {!isAddingCustomCategory && (
              <button
                type="button"
                onClick={() => setIsAddingCustomCategory(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add Custom Category</span>
              </button>
            )}
          </div>

          {!isAddingCustomCategory ? (
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
          ) : (
            /* Custom Category Inline Input */
            <div className="flex items-center gap-2 animate-in fade-in-50">
              <input
                type="text"
                autoFocus
                placeholder="Type custom category name (e.g. Corporate Gifts, Catering, Stage Decor)"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomCategory();
                  }
                }}
                className="flex-1 rounded-xl border border-emerald-500 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleSaveCustomCategory}
                className="clay-btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Category</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomCategory(false)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Pricing & Unit Row (with Dynamic Custom Unit) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Base Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Default Base Rate (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                placeholder="45000"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Unit Picker with Custom Option */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Default Unit
              </label>
              {!isAddingCustomUnit && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomUnit(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Custom Unit</span>
                </button>
              )}
            </div>

            {!isAddingCustomUnit ? (
              <select
                value={selectedUnit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="__ADD_NEW_UNIT__" className="font-bold text-emerald-600">
                  + Add Custom Unit...
                </option>
              </select>
            ) : (
              /* Custom Unit Input */
              <div className="flex items-center gap-1.5 animate-in fade-in-50">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Per Box, Meter, Roll"
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveCustomUnit();
                    }
                  }}
                  className="flex-1 rounded-xl border border-emerald-500 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomUnit}
                  className="clay-btn-emerald px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomUnit(false)}
                  className="px-2 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tax & HSN Row (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          {/* HSN / SAC Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>HSN / SAC Code</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 998596 (Events) or 491110 (Prints)"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Default GST Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Default GST Rate</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="0">0% (Nil / Exempted)</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST (Standard Services)</option>
              <option value="28">28% GST</option>
            </select>
          </div>
        </div>

        {/* Description / Scope */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Description / Specifications</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <textarea
            rows={3}
            placeholder="Default technical specs, material details, or scope of service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
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
            className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Service to Library</span>
          </button>
        </div>
      </form>
    </div>
  );
}
