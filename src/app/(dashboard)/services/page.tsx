"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CatalogService } from "@/services/service.service";
import { ServiceItem } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { ServiceEditDialog } from "@/components/services/service-edit-dialog";
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
  Edit3,
} from "lucide-react";

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Edit Dialog state
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await CatalogService.getServices();
      setServicesList(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete service "${name}"?`)) {
      setServicesList((prev) => prev.filter((s) => s.id !== id));
      await CatalogService.deleteService(id);
    }
  };

  const handleEditService = (item: ServiceItem) => {
    setEditingService(item);
    setIsEditDialogOpen(true);
  };

  const handleServiceUpdated = (updated: ServiceItem) => {
    setServicesList((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  // Metrics computation
  const totalServices = servicesList.length;

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

  const userCategories = useMemo(() => {
    return Array.from(new Set(servicesList.map((s) => s.category).filter(Boolean))) as string[];
  }, [servicesList]);

  const categoryFilters = useMemo(() => {
    return [
      { id: "all", label: "All Items" },
      ...userCategories.map((cat) => ({ id: cat, label: cat })),
    ];
  }, [userCategories]);

  // Search & filter logic
  const filteredServices = useMemo(() => {
    return servicesList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const hsn = item.hsnSac || item.hsnSacCode || "";
      const unit = item.unit || item.defaultUnit || "";

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        unit.toLowerCase().includes(query) ||
        hsn.includes(query);

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
            <span>Services & Catalog</span>
            <span className="clay-badge bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              {totalServices} Items
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your service inventory, pricing, default HSN/SAC codes, and GST rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/services/new">
            <button className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Add New Service</span>
            </button>
          </Link>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
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
        <div className="clay-card p-12 text-center flex flex-col items-center justify-center">
          <div className="clay-icon-squircle p-4 bg-emerald-50 text-emerald-600 border border-emerald-200/60 mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? "No matching services found" : "Your Service Catalog is Empty"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">
            {searchQuery
              ? `No items found matching "${searchQuery}". Try a different keyword.`
              : "Add your standard services and items with pre-set pricing for lightning-fast quotation and invoice creation."}
          </p>
          {!searchQuery && (
            <Link href="/services/new" className="mt-5">
              <button className="clay-btn-emerald inline-flex items-center gap-2 h-10 px-4 text-xs font-bold rounded-xl cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Create Your First Service</span>
              </button>
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================ */
        /* GRID VIEW: Card layout with claymorphism and quick actions   */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((item) => {
            const Icon = categoryIcons[item.category] || Package;
            const style = categoryStyles[item.category] || categoryStyles.custom;
            const displayRate = item.rate !== undefined ? item.rate : (item.defaultRate ?? 0);
            const displayUnit = item.unit || item.defaultUnit || "";
            const displayGst = item.gstRate !== undefined ? item.gstRate : (item.defaultTaxRate ?? 18);

            return (
              <div
                key={item.id}
                className="clay-card p-5 flex flex-col justify-between hover:border-emerald-300/80 transition-all duration-200 group relative"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "clay-icon-squircle p-2 border",
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

                    <div className="flex items-center gap-1.5">
                      {(item.hsnSac || item.hsnSacCode) && (
                        <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/60">
                          HSN: {item.hsnSac || item.hsnSacCode}
                        </span>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditService(item)}
                        title={`Edit ${item.name}`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-2xs transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Button */}
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
                          {displayRate > 0 ? formatCurrency(displayRate, "INR") : "Custom"}
                        </span>
                        {displayUnit && (
                          <span className="text-xs font-semibold text-slate-500">
                            / {displayUnit}
                          </span>
                        )}
                      </div>
                    </div>

                    {displayGst !== undefined && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                        {displayGst}% GST
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
                {filteredServices.map((item) => {
                  const displayRate = item.rate !== undefined ? item.rate : (item.defaultRate ?? 0);
                  const displayUnit = item.unit || item.defaultUnit || "-";
                  const displayGst = item.gstRate !== undefined ? item.gstRate : (item.defaultTaxRate ?? 18);

                  return (
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
                        {displayUnit}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">
                        {item.hsnSac || item.hsnSacCode || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                        {displayRate > 0 ? formatCurrency(displayRate, "INR") : "Custom"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                        {displayGst}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditService(item)}
                            title="Edit Service"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Service Modal Dialog */}
      <ServiceEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        service={editingService}
        onServiceUpdated={handleServiceUpdated}
      />
    </div>
  );
}
