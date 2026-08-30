"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_SERVICES_DATA, MockServiceDetail } from "@/mock/services.mock";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Sparkles,
  Printer,
  Palette,
  FileText,
  ReceiptText,
  LayoutGrid,
  List,
  Trash2,
} from "lucide-react";

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<MockServiceDetail[]>(MOCK_SERVICES_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Metrics computation
  const totalServices = servicesList.length;
  const eventServicesCount = servicesList.filter((s) => s.category === "event").length;
  const printServicesCount = servicesList.filter((s) => s.category === "printing").length;

  const categoryIcons: Record<string, React.ElementType> = {
    event: Sparkles,
    printing: Printer,
    design: Palette,
    custom: Package,
  };

  const categoryStyles: Record<
    string,
    { iconBg: string; text: string; tagBg: string; border: string }
  > = {
    event: {
      iconBg: "bg-purple-50 text-purple-700 border-purple-200/80",
      text: "text-purple-700",
      tagBg: "bg-purple-50 text-purple-800 border-purple-200/80",
      border: "border-purple-200",
    },
    printing: {
      iconBg: "bg-blue-50 text-blue-700 border-blue-200/80",
      text: "text-blue-700",
      tagBg: "bg-blue-50 text-blue-800 border-blue-200/80",
      border: "border-blue-200",
    },
    design: {
      iconBg: "bg-pink-50 text-pink-700 border-pink-200/80",
      text: "text-pink-700",
      tagBg: "bg-pink-50 text-pink-800 border-pink-200/80",
      border: "border-pink-200",
    },
    custom: {
      iconBg: "bg-slate-50 text-slate-700 border-slate-200/80",
      text: "text-slate-700",
      tagBg: "bg-slate-50 text-slate-800 border-slate-200/80",
      border: "border-slate-200",
    },
  };

  const categoryFilters = [
    { id: "all", label: "All Items" },
    { id: "event", label: "Events & Rentals" },
    { id: "printing", label: "Printing & Signage" },
    { id: "design", label: "Design & Creative" },
  ];

  const handleDeleteService = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your catalog?`)) {
      setServicesList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Search & filter logic
  const filteredServices = useMemo(() => {
    return servicesList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.defaultUnit && item.defaultUnit.toLowerCase().includes(query)) ||
        (item.hsnCode && item.hsnCode.includes(query));

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [servicesList, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Services & Pricing Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Saved pricing and service library for fast quote autocompletion. (Never mandatory during manual quote creation).
          </p>
        </div>

        <Link href="/services/new">
          <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Add New Item / Service</span>
          </button>
        </Link>
      </div>

      {/* 3 Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Catalog Items */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Catalog Items
            </span>
            <div className="clay-icon-squircle p-2.5 bg-slate-100 text-slate-700 border border-slate-200/80">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalServices}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Active service & material items
            </p>
          </div>
        </div>

        {/* Event Planning & Rentals */}
        <div className="clay-card p-5 bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Events & Rentals
            </span>
            <div className="clay-icon-squircle p-2.5 bg-purple-50 text-purple-700 border border-purple-200/80">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-purple-900">
              {eventServicesCount} Items
            </h3>
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              Stage, LED walls, audio & decor
            </p>
          </div>
        </div>

        {/* Printing & Fabrication */}
        <div className="clay-card p-5 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Printing & Fabrication
            </span>
            <div className="clay-icon-squircle p-2.5 bg-blue-50 text-blue-700 border border-blue-200/80">
              <Printer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-blue-900">
              {printServicesCount} Items
            </h3>
            <p className="text-[11px] text-blue-700 font-medium mt-1">
              Banners, brochures & sunboard
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar, Filter Tabs & View Toggle */}
      <div className="clay-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, unit, description, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills & View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "clay-tag px-3 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "table"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Services List Content */}
      {filteredServices.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center">
          <div className="clay-icon-squircle mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No items found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any services matching &ldquo;{searchQuery}&rdquo;. Try another search term or reset filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================ */
        /* GRID VIEW: Tactile Neo-Clay Service Cards                    */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((item) => {
            const Icon = categoryIcons[item.category] || Package;
            const style = categoryStyles[item.category] || categoryStyles.custom;

            return (
              <div
                key={item.id}
                className="clay-card p-5 flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Row: Category Icon, Badges & Delete Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "clay-icon-squircle p-2.5 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105",
                          style.iconBg
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "clay-tag inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          style.tagBg
                        )}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.hsnCode && (
                        <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/60">
                          HSN: {item.hsnCode}
                        </span>
                      )}

                      {/* Delete Button (Red Claymorphism) */}
                      <button
                        onClick={() => handleDeleteService(item.id, item.name)}
                        title={`Delete ${item.name}`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>


                  {/* Title & Description */}
                  <div className="mt-3.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Pricing Strip & Quick Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  {/* Price & Unit Display */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Base Rate
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-extrabold text-slate-900">
                          {item.defaultRate ? formatCurrency(item.defaultRate, "INR") : "Custom"}
                        </span>
                        {item.defaultUnit && (
                          <span className="text-xs font-semibold text-slate-500">
                            / {item.defaultUnit}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.defaultTaxRate && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                        {item.defaultTaxRate}% GST
                      </span>
                    )}
                  </div>

                  {/* 1-Click Action Buttons to create quote with this item */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/quotations/new?serviceId=${item.id}`}
                      className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>+ Quote</span>
                    </Link>

                    <Link
                      href={`/invoices/new?serviceId=${item.id}`}
                      className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                    >
                      <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
                      <span>+ Invoice</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* TABLE VIEW: Compact dense view for catalog auditing         */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Service / Material Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">HSN / SAC</th>
                  <th className="py-3.5 px-4 text-right">Standard Rate</th>
                  <th className="py-3.5 px-4 text-right">Default GST</th>
                  <th className="py-3.5 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="clay-tag capitalize px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {item.defaultUnit || "Fixed"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">
                      {item.hsnCode || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                      {item.defaultRate ? formatCurrency(item.defaultRate, "INR") : "Custom"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                      {item.defaultTaxRate ? `${item.defaultTaxRate}%` : "0%"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/quotations/new?serviceId=${item.id}`}
                          title="Use in Quotation"
                          className="clay-icon-squircle p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/invoices/new?serviceId=${item.id}`}
                          title="Use in Invoice"
                          className="clay-icon-squircle p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          <ReceiptText className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteService(item.id, item.name)}
                          title="Delete Service"
                          className="clay-icon-squircle p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>

                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
