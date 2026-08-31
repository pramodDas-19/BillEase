"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceService } from "@/services/invoice.service";
import { Invoice, InvoiceStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getWhatsAppInvoiceShareUrl } from "@/lib/whatsapp";
import { UpiQrModal } from "@/components/payments/upi-qr-modal";

import {
  ReceiptText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  Trash2,
  Phone,
  MessageSquare,
  LayoutGrid,
  List,
  Calendar,
  CreditCard,
  BellRing,
  QrCode,
} from "lucide-react";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeQrInvoice, setActiveQrInvoice] = useState<Invoice | null>(null);


  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await InvoiceService.getInvoices();
      setInvoicesList(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteInvoice = async (id: string, invoiceNum: string) => {
    if (window.confirm(`Are you sure you want to delete invoice "${invoiceNum}"?`)) {
      setInvoicesList((prev) => prev.filter((inv) => inv.id !== id));
      await InvoiceService.deleteInvoice(id);
    }
  };


  // Metrics computation (Clean Counts)
  const totalInvoices = invoicesList.length;
  const paidInvoices = invoicesList.filter((inv) => inv.status === "paid");
  const pendingInvoices = invoicesList.filter(
    (inv) => inv.status === "due" || inv.status === "partially_paid" || inv.status === "overdue"
  );
  const overdueInvoices = invoicesList.filter((inv) => inv.status === "overdue");

  const statusStyles: Record<
    InvoiceStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    draft: {
      label: "Draft",
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200/80",
    },
    sent: {
      label: "Sent",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200/80",
    },
    due: {
      label: "Payment Due",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200/80",
    },
    partially_paid: {
      label: "Partially Paid",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200/80",
    },
    paid: {
      label: "Paid / Settled",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200/80",
    },
    overdue: {
      label: "Overdue",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200/80",
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-slate-100",
      text: "text-slate-500",
      border: "border-slate-200/80",
    },
  };

  const filterOptions = [
    { id: "all", label: "All Invoices" },
    { id: "overdue", label: "Overdue" },
    { id: "partially_paid", label: "Partially Paid" },
    { id: "due", label: "Payment Due" },
    { id: "paid", label: "Paid / Settled" },
  ];

  // Search & filter logic

  const filteredInvoices = useMemo(() => {
    return invoicesList.filter((inv) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.clientName.toLowerCase().includes(query) ||
        (inv.clientPhone && inv.clientPhone.includes(query)) ||
        (inv.quotationNumber && inv.quotationNumber.toLowerCase().includes(query)) ||
        inv.items.some((item) => item.description.toLowerCase().includes(query));

      let matchesFilter = true;
      if (selectedFilter !== "all") {
        matchesFilter = inv.status === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [invoicesList, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Invoices & Billing</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage tax bills, record partial/advance payments, track overdue collections, and generate printable GST receipts.
          </p>
        </div>

        <Link href="/invoices/new">
          <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Create New Invoice</span>
          </button>
        </Link>
      </div>

      {/* 3 Quick Summary Metric Cards (Clean Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Invoices Generated */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Invoices
            </span>
            <div className="clay-icon-squircle p-2.5 bg-slate-100 text-slate-700 border border-slate-200/80">
              <ReceiptText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalInvoices}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Total tax & commercial bills
            </p>
          </div>
        </div>

        {/* Settled / Paid Invoices (Green) */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Settled Invoices
            </span>
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-emerald-800">
              {paidInvoices.length}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Fully paid accounts
            </p>
          </div>
        </div>

        {/* Pending & Overdue Invoices (Amber/Red) */}
        <div className="clay-card p-5 bg-gradient-to-br from-amber-50/30 via-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending & Overdue
            </span>
            <div className="clay-icon-squircle p-2.5 bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-amber-800">
              {pendingInvoices.length}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {overdueInvoices.length} overdue collections
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
            placeholder="Search by invoice #, client name, phone, item..."
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

      {/* Invoices List Content */}
      {filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center">
          <div className="clay-icon-squircle mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No invoices found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any bills matching &ldquo;{searchQuery}&rdquo;. Try another search query or clear filters.
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
        /* GRID VIEW: Tactile Neo-Clay Invoice Cards                    */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvoices.map((inv) => {
            const statusConfig = statusStyles[inv.status] || statusStyles.draft;
            const cleanPhone = inv.clientPhone ? inv.clientPhone.replace(/[^0-9]/g, "") : "";
            const primaryItem = inv.items[0]?.description || "General Services";
            const isOverdue = inv.status === "overdue";

            return (
              <div
                key={inv.id}
                className="clay-card p-5 flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Row: Invoice #, Status Pill & Direct Quick Actions */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-sm font-extrabold text-slate-900 hover:text-emerald-700 transition-colors"
                        >
                          {inv.invoiceNumber}
                        </Link>
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
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Issued {formatDate(inv.issueDate)}</span>
                        </p>
                        {inv.quotationNumber && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.2 rounded font-bold">
                            From #{inv.quotationNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Top Action Icons: Call, WhatsApp Share, Red Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {inv.clientPhone && (
                        <a
                          href={`tel:${inv.clientPhone}`}
                          title={`Call ${inv.clientName}`}
                          className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      )}

                      {inv.clientPhone && (
                        <a
                          href={getWhatsAppInvoiceShareUrl({
                            clientPhone: inv.clientPhone,
                            clientName: inv.clientName,
                            invoiceNumber: inv.invoiceNumber,
                            invoiceId: inv.id,
                            totalAmount: inv.totalAmount,
                            balanceDue: inv.balanceDue,
                            currency: inv.currency,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Share Invoice & 1-Click Pay Link on WhatsApp"
                          className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      )}



                      {/* Dynamic UPI QR Trigger Button */}
                      {inv.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveQrInvoice(inv)}
                          title="Generate Dynamic UPI QR Code"
                          className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        title="Delete Invoice"
                        className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                    </div>
                  </div>

                  {/* Client Name & Scope */}
                  <div className="mt-3.5 space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {inv.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {primaryItem}
                      {inv.items.length > 1 && (
                        <span className="text-slate-400 text-[11px] font-semibold ml-1">
                          (+{inv.items.length - 1} more items)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Financial Breakdown & 1-Click Payment Log */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  {/* Financial Breakdown Strip */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-200/60 mb-3 text-xs">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Total Bill
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Paid
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(inv.paidAmount || 0, inv.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Balance Due
                      </span>
                      <span
                        className={cn(
                          "font-extrabold",
                          inv.balanceDue > 0
                            ? isOverdue
                              ? "text-rose-600"
                              : "text-amber-700"
                            : "text-emerald-700"
                        )}
                      >
                        {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue, inv.currency) : "Settled"}
                      </span>
                    </div>
                  </div>

                  {/* Due Date Indicator */}
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="text-slate-400 font-medium">Due Date:</span>
                    <span
                      className={cn(
                        "font-bold",
                        isOverdue ? "text-rose-600 flex items-center gap-1" : "text-slate-700"
                      )}
                    >
                      {isOverdue && <AlertTriangle className="h-3 w-3" />}
                      {formatDate(inv.dueDate)} {isOverdue && "(Overdue)"}
                    </span>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Primary Button: Record Payment or Logged Status */}
                    {inv.balanceDue > 0 ? (
                      <Link
                        href={`/payments/record?invoiceId=${inv.id}`}
                        className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition-colors"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Record Pay</span>
                      </Link>
                    ) : (
                      <div className="clay-tag flex items-center justify-center gap-1 py-2 text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200/60">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Settled</span>
                      </div>
                    )}

                    {/* Preview Tax Invoice PDF */}
                    <Link
                      href={`/invoices/${inv.id}/preview`}
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
        /* TABLE VIEW: Compact dense view for invoice audits           */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client / Scope</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const statusConfig = statusStyles[inv.status] || statusStyles.draft;
                  const cleanPhone = inv.clientPhone ? inv.clientPhone.replace(/[^0-9]/g, "") : "";
                  const isOverdue = inv.status === "overdue";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        {inv.quotationNumber && (
                          <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                            From #{inv.quotationNumber}
                          </span>
                        )}
                      </td>

                      {/* Client Name & Scope */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{inv.clientName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {inv.items[0]?.description}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                          {formatDate(inv.dueDate)}
                        </span>
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
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                        <span
                          className={
                            inv.balanceDue > 0
                              ? isOverdue
                                ? "text-rose-600"
                                : "text-amber-700"
                              : "text-emerald-700"
                          }
                        >
                          {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue, inv.currency) : "Settled"}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Record Payment shortcut */}
                          {inv.balanceDue > 0 && (
                            <Link
                              href={`/payments/record?invoiceId=${inv.id}`}
                              title="Record Payment"
                              className="clay-icon-squircle p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              <CreditCard className="h-3 w-3" />
                            </Link>
                          )}

                          {/* WhatsApp Share */}

                          {inv.clientPhone && (
                            <a
                              href={getWhatsAppInvoiceShareUrl({
                                clientPhone: inv.clientPhone,
                                clientName: inv.clientName,
                                invoiceNumber: inv.invoiceNumber,
                                invoiceId: inv.id,
                                totalAmount: inv.totalAmount,
                                balanceDue: inv.balanceDue,
                                currency: inv.currency,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Share Invoice & 1-Click Pay Link on WhatsApp"
                              className="clay-icon-squircle p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-colors"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </a>
                          )}


                          {/* Preview PDF */}
                          <Link
                            href={`/invoices/${inv.id}/preview`}
                            title="Preview Tax Invoice"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                          </Link>

                          {/* Red Clay Delete */}
                          <button
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                            title="Delete Invoice"
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

      {/* Dynamic UPI QR Modal */}
      {activeQrInvoice && (
        <UpiQrModal
          isOpen={!!activeQrInvoice}
          onClose={() => setActiveQrInvoice(null)}
          invoiceNumber={activeQrInvoice.invoiceNumber}
          clientName={activeQrInvoice.clientName}
          balanceDue={activeQrInvoice.balanceDue}
        />
      )}
    </div>
  );
}


