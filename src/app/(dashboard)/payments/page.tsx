"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PaymentService } from "@/services/payment.service";
import { Payment, PaymentMethod } from "@/types";
import { getWhatsAppPaymentReceiptUrl } from "@/lib/whatsapp";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  ReceiptText,
  Trash2,
  MessageSquare,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  Banknote,
  Smartphone,
  Download,
} from "lucide-react";
import { exportPaymentsToCsv } from "@/lib/export-csv";


export default function PaymentsPage() {
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await PaymentService.getPayments();
      setPaymentsList(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeletePayment = async (id: string, payNum: string) => {
    if (window.confirm(`Are you sure you want to delete payment receipt "${payNum}"?`)) {
      setPaymentsList((prev) => prev.filter((p) => p.id !== id));
      await PaymentService.deletePayment(id);
    }
  };


  // Metrics computation (Clean Counts)
  const totalTransactions = paymentsList.length;
  const onlineSettlements = paymentsList.filter(
    (p) => p.paymentMethod === "upi" || p.paymentMethod === "bank_transfer"
  ).length;
  const cashSettlements = paymentsList.filter((p) => p.paymentMethod === "cash").length;

  const methodStyles: Record<
    PaymentMethod,
    { label: string; bg: string; text: string; border: string; Icon: React.ElementType }
  > = {
    upi: {
      label: "UPI / GPay",
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200/80",
      Icon: Smartphone,
    },
    bank_transfer: {
      label: "Bank Transfer",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200/80",
      Icon: Building2,
    },
    cash: {
      label: "Cash",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200/80",
      Icon: Banknote,
    },
    cheque: {
      label: "Cheque",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200/80",
      Icon: CreditCard,
    },
    card: {
      label: "Debit / Credit Card",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200/80",
      Icon: CreditCard,
    },
    online: {
      label: "Online Gateway",
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200/80",
      Icon: Smartphone,
    },
    other: {
      label: "Other",
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200/80",
      Icon: CreditCard,
    },
  };


  const filterOptions = [
    { id: "all", label: "All Receipts" },
    { id: "upi", label: "UPI / GPay" },
    { id: "bank_transfer", label: "Bank Transfer" },
    { id: "cash", label: "Cash" },
  ];

  // Search & filter logic

  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.paymentNumber.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        p.invoiceNumber.toLowerCase().includes(query) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(query)) ||
        (p.notes && p.notes.toLowerCase().includes(query));

      let matchesFilter = true;
      if (selectedFilter !== "all") {
        matchesFilter = p.paymentMethod === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [paymentsList, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Payments & Receipts Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Complete settlement ledger of client advances, UPI transfers, bank deposits, and cash receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportPaymentsToCsv(filteredPayments)}
            disabled={filteredPayments.length === 0}
            className="clay-icon-squircle flex items-center gap-1.5 h-11 px-4 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Export Payments as CSV"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <Link href="/payments/record">
            <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Record Payment</span>
            </button>
          </Link>
        </div>
      </div>


      {/* 3 Quick Summary Metric Cards (Clean Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Receipts Logged */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Receipts Logged
            </span>
            <div className="clay-icon-squircle p-2.5 bg-slate-100 text-slate-700 border border-slate-200/80">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalTransactions}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              All payment settlements
            </p>
          </div>
        </div>

        {/* UPI & Bank Settlements (Teal/Blue) */}
        <div className="clay-card p-5 bg-gradient-to-br from-teal-50/30 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              UPI & Bank Transfers
            </span>
            <div className="clay-icon-squircle p-2.5 bg-teal-50 text-teal-700 border border-teal-200/80">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-teal-900">
              {onlineSettlements}
            </h3>
            <p className="text-[11px] text-teal-700 font-medium mt-1">
              GPay, PhonePe & NetBanking
            </p>
          </div>
        </div>

        {/* Cash Collections (Emerald) */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cash Collections
            </span>
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-emerald-800">
              {cashSettlements}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Direct in-hand receipts
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
            placeholder="Search by receipt #, client, invoice #, UTR..."
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

      {/* Payments List Content */}
      {filteredPayments.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center">
          <div className="clay-icon-squircle mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No payment receipts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any transactions matching &ldquo;{searchQuery}&rdquo;. Try another search term or reset filter.
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
        /* GRID VIEW: Tactile Neo-Clay Payment Cards                    */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPayments.map((p) => {
            const methodConfig = methodStyles[p.paymentMethod] || methodStyles.other;
            const MethodIcon = methodConfig.Icon;

            return (
              <div
                key={p.id}
                className="clay-card p-5 flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Row: Receipt #, Method Pill & Delete */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {p.paymentNumber}
                        </span>
                        <span
                          className={cn(
                            "clay-tag inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border",
                            methodConfig.bg,
                            methodConfig.text,
                            methodConfig.border
                          )}
                        >
                          <MethodIcon className="h-3 w-3" />
                          <span>{methodConfig.label}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Received {formatDate(p.paymentDate)}</span>
                      </p>
                    </div>

                    {/* Red Delete Button */}
                    <button
                      onClick={() => handleDeletePayment(p.id, p.paymentNumber)}
                      title="Delete Receipt"
                      className="clay-icon-squircle flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Client Name & Linked Invoice */}
                  <div className="mt-3.5 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {p.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span>Linked Bill:</span>
                      <Link
                        href={`/invoices/${p.invoiceId}`}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        #{p.invoiceNumber}
                      </Link>
                    </p>
                    {p.transactionReference && (
                      <p className="text-[11px] text-slate-400 font-mono truncate pt-0.5">
                        Ref: {p.transactionReference}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Amount Received & Quick WhatsApp Acknowledgment */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Amount Settled
                      </span>
                      <span className="text-lg font-extrabold text-emerald-700">
                        {formatCurrency(p.amount, p.currency)}
                      </span>
                    </div>

                    <span className="clay-tag inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* 1-Click WhatsApp Receipt Acknowledgment */}
                    <a
                      href={getWhatsAppPaymentReceiptUrl({
                        clientName: p.clientName,
                        invoiceNumber: p.invoiceNumber,
                        paymentNumber: p.paymentNumber,
                        amount: p.amount,
                        currency: p.currency,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                      <span>WhatsApp</span>
                    </a>

                    {/* View Linked Invoice */}
                    <Link
                      href={`/invoices/${p.invoiceId}`}
                      className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                    >
                      <ReceiptText className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Bill</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* TABLE VIEW: Compact dense financial transaction ledger     */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">UTR / Transaction Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount Settled</th>
                  <th className="py-3.5 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const methodConfig = methodStyles[p.paymentMethod] || methodStyles.other;
                  const MethodIcon = methodConfig.Icon;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.clientName}</td>
                      <td className="py-3.5 px-4 font-semibold">
                        <Link
                          href={`/invoices/${p.invoiceId}`}
                          className="text-emerald-700 hover:underline"
                        >
                          #{p.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "clay-tag inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border",
                            methodConfig.bg,
                            methodConfig.text,
                            methodConfig.border
                          )}
                        >
                          <MethodIcon className="h-3 w-3" />
                          <span>{methodConfig.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.transactionReference || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 text-sm">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Acknowledgment */}
                          <a
                            href={getWhatsAppPaymentReceiptUrl({
                              clientName: p.clientName,
                              invoiceNumber: p.invoiceNumber,
                              paymentNumber: p.paymentNumber,
                              amount: p.amount,
                              currency: p.currency,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send WhatsApp Acknowledgment"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>


                          {/* Delete Receipt */}
                          <button
                            onClick={() => handleDeletePayment(p.id, p.paymentNumber)}
                            title="Delete Receipt"
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
