"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { QuotationService } from "@/services/quotation.service";
import { Quotation, QuotationStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getWhatsAppQuotationShareUrl } from "@/lib/whatsapp";

import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  Trash2,
  Phone,
  MessageSquare,
  ReceiptText,
  LayoutGrid,
  List,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Edit3,
} from "lucide-react";

export default function QuotationsPage() {
  const router = useRouter();
  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await QuotationService.getQuotations();
      setQuotationsList(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteQuote = async (id: string, quoteNum: string) => {
    if (window.confirm(`Are you sure you want to delete quotation "${quoteNum}"?`)) {
      setQuotationsList((prev) => prev.filter((q) => q.id !== id));
      await QuotationService.deleteQuotation(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: QuotationStatus) => {
    setQuotationsList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    await QuotationService.updateQuotationStatus(id, newStatus);
  };



  // Metrics computation
  const totalQuotes = quotationsList.length;
  const pendingQuotes = quotationsList.filter((q) => q.status === "sent");
  const pendingValue = pendingQuotes.reduce((acc, q) => acc + q.totalAmount, 0);
  const acceptedOrConverted = quotationsList.filter(
    (q) => q.status === "accepted" || q.status === "converted"
  );
  const convertedValue = acceptedOrConverted.reduce((acc, q) => acc + q.totalAmount, 0);

  const statusStyles: Record<
    QuotationStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    draft: {
      label: "Draft",
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200/80",
    },
    sent: {
      label: "Sent / Pending",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200/80",
    },
    viewed: {
      label: "Viewed by Client",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200/80",
    },
    accepted: {
      label: "Accepted",

      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200/80",
    },
    rejected: {
      label: "Declined",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200/80",
    },
    expired: {
      label: "Expired",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200/80",
    },
    converted: {
      label: "Converted to Invoice",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200/80",
    },
  };

  const filterOptions = [
    { id: "all", label: "All Quotes" },
    { id: "sent", label: "Pending Approval" },
    { id: "accepted", label: "Accepted" },
    { id: "converted", label: "Converted to Invoice" },
    { id: "draft", label: "Drafts" },
    { id: "expired", label: "Expired" },
  ];

  // Convert quotation to invoice handler
  const handleConvertToInvoice = (quote: Quotation) => {
    router.push(`/invoices/new?fromQuoteId=${quote.id}&clientId=${quote.clientId}`);
  };

  // Search & filter logic

  const filteredQuotations = useMemo(() => {
    return quotationsList.filter((q) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        q.quotationNumber.toLowerCase().includes(query) ||
        q.clientName.toLowerCase().includes(query) ||
        (q.clientPhone && q.clientPhone.includes(query)) ||
        q.items.some((item) => item.description.toLowerCase().includes(query));

      let matchesFilter = true;
      if (selectedFilter !== "all") {
        matchesFilter = q.status === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [quotationsList, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Quotations & Estimates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Create professional price proposals, share via WhatsApp/PDF, and convert accepted quotes into tax invoices with 1 click.
          </p>
        </div>

        <Link href="/quotations/new">
          <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Create New Quotation</span>
          </button>
        </Link>
      </div>

      {/* 3 Quick Summary Metric Cards (Clean Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Quotes Generated */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Quotations
            </span>
            <div className="clay-icon-squircle p-2.5 bg-slate-100 text-slate-700 border border-slate-200/80">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalQuotes}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              All created pipeline proposals
            </p>
          </div>
        </div>

        {/* Accepted Quotations (Green) */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Accepted Quotations
            </span>
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-emerald-800">
              {acceptedOrConverted.length}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Approved & ready for billing
            </p>
          </div>
        </div>

        {/* Pending Quotations (Amber) */}
        <div className="clay-card p-5 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Quotations
            </span>
            <div className="clay-icon-squircle p-2.5 bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-amber-800">
              {pendingQuotes.length}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Awaiting client response
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
            placeholder="Search by quote #, client name, phone, item..."
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

        {/* Filter Pills & View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedFilter(opt.id)}
                className={cn(
                  "clay-tag px-3 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedFilter === opt.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                )}
              >
                {opt.label}
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

      {/* Quotations List Content */}
      {filteredQuotations.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center">
          <div className="clay-icon-squircle mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No quotations found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any estimates matching &ldquo;{searchQuery}&rdquo;. Try checking the spelling or resetting your filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================ */
        /* GRID VIEW: Tactile Neo-Clay Quotation Cards                  */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuotations.map((q) => {
            const statusConfig = statusStyles[q.status] || statusStyles.draft;
            const cleanPhone = q.clientPhone ? q.clientPhone.replace(/[^0-9]/g, "") : "";
            const primaryItem = q.items[0]?.description || "General Services Quote";

            return (
              <div
                key={q.id}
                className="clay-card p-5 flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Row: Quote #, Status Pill & Direct Quick Actions */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="text-sm font-extrabold text-slate-900 hover:text-emerald-700 transition-colors"
                        >
                          {q.quotationNumber}
                        </Link>
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.id, e.target.value as QuotationStatus)}
                          className={cn(
                            "clay-tag text-[10px] font-bold border px-1.5 py-0.5 rounded-lg cursor-pointer focus:outline-none",
                            statusConfig.bg,
                            statusConfig.text,
                            statusConfig.border
                          )}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent / Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="converted">Converted to Invoice</option>
                          <option value="rejected">Declined</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Issued {formatDate(q.date)}</span>
                      </p>
                    </div>

                    {/* Top Action Icons: Call, WhatsApp Share, Red Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {q.clientPhone && (
                        <a
                          href={`tel:${q.clientPhone}`}
                          title={`Call ${q.clientName}`}
                          className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      )}

                      {q.clientPhone && (
                        <a
                          href={getWhatsAppQuotationShareUrl({
                            clientPhone: q.clientPhone,
                            clientName: q.clientName,
                            quotationNumber: q.quotationNumber,
                            quotationId: q.id,
                            totalAmount: q.totalAmount,
                            validUntil: formatDate(q.validUntil),
                            currency: q.currency,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Share Quote & 1-Click Pay on WhatsApp"
                          className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      )}


                      <Link
                        href={`/quotations/${q.id}/edit`}
                        title={`Edit Quotation #${q.quotationNumber}`}
                        className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-2xs transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Link>

                      <button
                        onClick={() => handleDeleteQuote(q.id, q.quotationNumber)}
                        title="Delete Quotation"
                        className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                    </div>
                  </div>

                  {/* Client Name & Line Items Scope Preview */}
                  <div className="mt-3.5 space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {q.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {primaryItem}
                      {q.items.length > 1 && (
                        <span className="text-slate-400 text-[11px] font-semibold ml-1">
                          (+{q.items.length - 1} more items)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Total Amount & 1-Click Invoice Conversion */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Estimated Total
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(q.totalAmount, q.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Validity
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatDate(q.validUntil)}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Primary Button: Convert to Invoice (or View Invoice if already converted) */}
                    {q.status === "converted" ? (
                      <Link
                        href={q.convertedToInvoiceId ? `/invoices/${q.convertedToInvoiceId}` : `/invoices`}
                        className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors"
                      >
                        <ReceiptText className="h-3.5 w-3.5 text-purple-600" />
                        <span>View Invoice</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleConvertToInvoice(q)}
                        className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition-all cursor-pointer"
                      >
                        <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
                        <span>To Invoice</span>
                      </button>
                    )}


                    {/* Preview / Details Button */}
                    <Link
                      href={`/quotations/${q.id}/preview`}
                      className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Preview PDF</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* TABLE VIEW: Compact dense view for quotation audits         */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Quote #</th>
                  <th className="py-3.5 px-4">Client / Proposal Scope</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => {
                  const statusConfig = statusStyles[q.status] || statusStyles.draft;
                  const cleanPhone = q.clientPhone ? q.clientPhone.replace(/[^0-9]/g, "") : "";

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Quote Number */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                        >
                          {q.quotationNumber}
                        </Link>
                      </td>

                      {/* Client Name & Scope */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{q.clientName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {q.items[0]?.description}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(q.date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(q.validUntil)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "clay-tag inline-block px-2 py-0.5 text-[10px] font-bold border",
                            statusConfig.bg,
                            statusConfig.text,
                            statusConfig.border
                          )}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(q.totalAmount, q.currency)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-Click Convert to Invoice */}
                          {q.status !== "converted" && (
                            <button
                              onClick={() => handleConvertToInvoice(q)}
                              title="Convert to Invoice"
                              className="clay-icon-squircle p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <ReceiptText className="h-3 w-3" />
                            </button>
                          )}

                          {/* WhatsApp Share */}
                          {q.clientPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${q.clientName}, here is your quotation #${q.quotationNumber} for ${formatCurrency(
                                  q.totalAmount,
                                  q.currency
                                )}. Please review and let us know. Thank you!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Share on WhatsApp"
                              className="clay-icon-squircle p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-colors"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </a>
                          )}

                          {/* Preview PDF */}
                          <Link
                            href={`/quotations/${q.id}/preview`}
                            title="Preview PDF"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                          </Link>

                          {/* Edit Quote */}
                          <Link
                            href={`/quotations/${q.id}/edit`}
                            title="Edit Quotation"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Link>

                          {/* Red Clay Delete */}
                          <button
                            onClick={() => handleDeleteQuote(q.id, q.quotationNumber)}
                            title="Delete Quote"
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
    </div>
  );
}
