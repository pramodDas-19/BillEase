"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { CURRENCIES } from "@/constants/currencies";
import { CurrencyCode } from "@/types";
import {
  ArrowLeft,
  CreditCard,
  Save,
  CheckCircle2,
  Calendar,
  Building2,
  Smartphone,
  Banknote,
  Search,
  Check,
  ChevronDown,
  X,
  FileText,
  Clock,
  Sparkles,
  Receipt,
  Percent,
} from "lucide-react";

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId") || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState("");
  const [amountMode, setAmountMode] = useState<"fixed" | "percentage">("fixed");
  const [percentValue, setPercentValue] = useState("");
  const [isCustomPercentOpen, setIsCustomPercentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer" | "cash" | "cheque">("upi");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [activeQuickFill, setActiveQuickFill] = useState<
    "full" | "50" | "20" | "10" | "custom" | null
  >("full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvoices() {
      const data = await InvoiceService.getInvoices();
      setInvoices(data || []);
      if (initialInvoiceId) {
        const found = data.find((inv) => inv.id === initialInvoiceId);
        if (found) {
          setSelectedInvoiceId(found.id);
          setAmount(found.balanceDue.toString());
        }
      } else if (data.length > 0) {
        // Pick first invoice with balance due if available
        const withDue = data.find((inv) => inv.balanceDue > 0) || data[0];
        setSelectedInvoiceId(withDue.id);
        setAmount(withDue.balanceDue.toString());
      }
    }
    loadInvoices();
  }, [initialInvoiceId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsInvoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Filter invoices for search combobox
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return invoices;
    const q = invoiceSearchQuery.toLowerCase().trim();

    return invoices.filter((inv) => {
      const invNum = inv.invoiceNumber.toLowerCase();
      const client = inv.clientName.toLowerCase();
      const phone = inv.clientPhone ? inv.clientPhone.toLowerCase() : "";
      const services = (inv.items || [])
        .map((i) => i.description.toLowerCase())
        .join(" ");

      return (
        invNum.includes(q) ||
        client.includes(q) ||
        phone.includes(q) ||
        services.includes(q)
      );
    });
  }, [invoices, invoiceSearchQuery]);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setAmount(inv.balanceDue.toString());
    const pct =
      inv.totalAmount > 0
        ? ((inv.balanceDue / inv.totalAmount) * 100).toFixed(1)
        : "100";
    setPercentValue(pct);
    setActiveQuickFill("full");
    setIsInvoiceDropdownOpen(false);
    setInvoiceSearchQuery("");
  };

  const handleQuickPercent = (percent: number) => {
    if (!selectedInvoice) return;
    const calculated = Math.round((selectedInvoice.totalAmount * percent) / 100);
    setAmount(calculated.toString());
    setPercentValue(percent.toString());
    setIsCustomPercentOpen(false);
    setActiveQuickFill(
      percent === 50 ? "50" : percent === 20 ? "20" : percent === 10 ? "10" : "custom"
    );
  };

  const handleFullBalance = () => {
    if (!selectedInvoice) return;
    setAmount(selectedInvoice.balanceDue.toString());
    const pct =
      selectedInvoice.totalAmount > 0
        ? ((selectedInvoice.balanceDue / selectedInvoice.totalAmount) * 100).toFixed(1)
        : "100";
    setPercentValue(pct);
    setIsCustomPercentOpen(false);
    setActiveQuickFill("full");
  };

  const handleModeSwitch = (mode: "fixed" | "percentage") => {
    setAmountMode(mode);
    if (mode === "percentage") {
      if (selectedInvoice && parsedAmount > 0 && selectedInvoice.totalAmount > 0) {
        setPercentValue(((parsedAmount / selectedInvoice.totalAmount) * 100).toFixed(1));
      }
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setActiveQuickFill(null);
    setIsCustomPercentOpen(false);
    const num = parseFloat(val);
    if (!isNaN(num) && selectedInvoice && selectedInvoice.totalAmount > 0) {
      setPercentValue(((num / selectedInvoice.totalAmount) * 100).toFixed(1));
    }
  };

  const handlePercentInputChange = (val: string) => {
    setPercentValue(val);
    setActiveQuickFill("custom");
    const num = parseFloat(val);
    if (!isNaN(num) && selectedInvoice && num >= 0) {
      const calculated = Math.round((selectedInvoice.totalAmount * num) / 100);
      setAmount(calculated.toString());
    } else if (!val) {
      setAmount("");
    }
  };

  // Live settlement calculation
  const currencyCode = (selectedInvoice?.currency || "INR") as CurrencyCode;
  const currencySymbol = CURRENCIES[currencyCode]?.symbol || "₹";
  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = selectedInvoice ? selectedInvoice.balanceDue : 0;
  const halfAdvance = selectedInvoice ? Math.round((selectedInvoice.totalAmount * 50) / 100) : 0;
  const tokenAdvance = selectedInvoice ? Math.round((selectedInvoice.totalAmount * 20) / 100) : 0;
  const tenToken = selectedInvoice ? Math.round((selectedInvoice.totalAmount * 10) / 100) : 0;
  const remainingBalanceAfter = Math.max(0, currentBalance - parsedAmount);

  // Derive which quick fill button is active
  const isFullDueActive =
    activeQuickFill === "full" ||
    (parsedAmount > 0 && Math.abs(parsedAmount - currentBalance) < 0.01);
  const is50Active =
    !isFullDueActive &&
    (activeQuickFill === "50" ||
      (parsedAmount > 0 && halfAdvance > 0 && Math.abs(parsedAmount - halfAdvance) < 1));
  const is20Active =
    !isFullDueActive &&
    !is50Active &&
    (activeQuickFill === "20" ||
      (parsedAmount > 0 && tokenAdvance > 0 && Math.abs(parsedAmount - tokenAdvance) < 1));
  const is10Active =
    !isFullDueActive &&
    !is50Active &&
    !is20Active &&
    (activeQuickFill === "10" ||
      (parsedAmount > 0 && tenToken > 0 && Math.abs(parsedAmount - tenToken) < 1));
  const isCustomPercentActive = activeQuickFill === "custom";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const payNum = `PAY-${Date.now().toString().slice(-4)}`;
      await PaymentService.createPayment({
        paymentNumber: payNum,
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.clientId,
        clientName: selectedInvoice.clientName,
        amount: parsedAmount,
        currency: selectedInvoice.currency || "INR",
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      router.push("/payments");
    } catch (err) {
      console.error("Failed to record payment:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Record Payment Receipt</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Log client settlements, advance deposits, and generate verified payment receipts.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Invoice Search & Selector Combobox */}
        <div className="clay-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>Select Invoice to Settle</span>
                <span className="text-rose-500">*</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Search by Invoice #, Client Name, Phone, or Service description.
              </p>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            {/* Active Selected Invoice Card Display */}
            {selectedInvoice && !isInvoiceDropdownOpen ? (
              <div
                onClick={() => setIsInvoiceDropdownOpen(true)}
                className="group p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {selectedInvoice.invoiceNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-bold text-sm text-slate-800">
                      {selectedInvoice.clientName}
                    </span>
                    {selectedInvoice.clientPhone && (
                      <span className="text-xs text-slate-500 font-medium">
                        ({selectedInvoice.clientPhone})
                      </span>
                    )}
                  </div>

                  {/* Services summary */}
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    Services: {selectedInvoice.items?.map((i) => i.description).filter(Boolean).join(", ") || "Custom Item"}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Current Due
                    </span>
                    <span
                      className={cn(
                        "font-black text-sm",
                        selectedInvoice.balanceDue > 0 ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="clay-tag px-3 py-1 text-xs font-bold bg-white text-emerald-700 border border-slate-200 group-hover:border-emerald-300 transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              /* Search Input Combobox */
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by invoice number (INV-1001), client name, phone, or service..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    onFocus={() => setIsInvoiceDropdownOpen(true)}
                    className="w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-2xl bg-white border border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
                  />
                  {selectedInvoice && (
                    <button
                      type="button"
                      onClick={() => setIsInvoiceDropdownOpen(false)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions Menu */}
                {isInvoiceDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-72 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                    {filteredInvoices.length === 0 ? (
                      <div className="p-4 text-center text-xs font-medium text-slate-400">
                        No matching invoices found for &quot;{invoiceSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const isChosen = inv.id === selectedInvoiceId;
                        const servicesSummary =
                          inv.items?.map((i) => i.description).filter(Boolean).join(", ") ||
                          "Standard Services";

                        return (
                          <div
                            key={inv.id}
                            onClick={() => handleSelectInvoice(inv)}
                            className={cn(
                              "p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3",
                              isChosen
                                ? "bg-emerald-50/80 border border-emerald-200"
                                : "hover:bg-slate-50 border border-transparent"
                            )}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="font-bold text-sm text-slate-800 truncate">
                                  {inv.clientName}
                                </span>
                                {inv.clientPhone && (
                                  <span className="text-xs text-slate-400 font-medium">
                                    ({inv.clientPhone})
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-md">
                                {servicesSummary}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                Total: {formatCurrency(inv.totalAmount, inv.currency)}
                              </span>
                              <span
                                className={cn(
                                  "font-black text-xs",
                                  inv.balanceDue > 0 ? "text-amber-700" : "text-emerald-700"
                                )}
                              >
                                Due: {formatCurrency(inv.balanceDue, inv.currency)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Invoice Breakdown Banner */}
          {selectedInvoice && (
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 text-xs">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Total Bill
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Previously Settled
                </span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(selectedInvoice.paidAmount || 0, selectedInvoice.currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Current Balance Due
                </span>
                <span className="font-black text-amber-700 text-base">
                  {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Payment Amount & Live Settlement Preview */}
        <div className="clay-card p-6 sm:p-7 space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>Payment Amount & Settlement</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Left: Amount Input & Quick Fill */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Amount Received <span className="text-rose-500">*</span>
                </label>

                {/* Currency vs Percentage Segmented Mode Switch */}
                <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("fixed")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      amountMode === "fixed"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {currencySymbol} Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("percentage")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                      amountMode === "percentage"
                        ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Percent className="h-3 w-3" />
                    <span>Percent (%)</span>
                  </button>
                </div>
              </div>

              {amountMode === "fixed" ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-lg font-black text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all"
                    />
                  </div>
                  {selectedInvoice && parsedAmount > 0 && selectedInvoice.totalAmount > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-1">
                      <span>Equates to:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                        {((parsedAmount / selectedInvoice.totalAmount) * 100).toFixed(1)}% of total bill ({formatCurrency(selectedInvoice.totalAmount, currencyCode)})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      placeholder="e.g. 13 for 13%"
                      value={percentValue}
                      onChange={(e) => handlePercentInputChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-10 py-3 text-lg font-black text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-emerald-600">
                      %
                    </span>
                  </div>
                  {selectedInvoice && parsedAmount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50/90 border border-emerald-200/80 rounded-xl px-3 py-1.5 animate-in fade-in-50">
                      <span>Calculated Payment:</span>
                      <span className="font-black text-slate-900 text-sm">
                        {formatCurrency(parsedAmount, currencyCode)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({percentValue}% of {formatCurrency(selectedInvoice.totalAmount, currencyCode)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Fill Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-bold">Quick Fill:</span>
                <button
                  type="button"
                  onClick={handleFullBalance}
                  className={cn(
                    "clay-tag px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                    isFullDueActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                  )}
                >
                  Full Due ({formatCurrency(currentBalance, currencyCode)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className={cn(
                    "clay-tag px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                    is50Active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                  )}
                >
                  50% Advance {halfAdvance > 0 && `(${formatCurrency(halfAdvance, currencyCode)})`}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(20)}
                  className={cn(
                    "clay-tag px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                    is20Active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                  )}
                >
                  20% Token {tokenAdvance > 0 && `(${formatCurrency(tokenAdvance, currencyCode)})`}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(10)}
                  className={cn(
                    "clay-tag px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                    is10Active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                  )}
                >
                  10% Token {tenToken > 0 && `(${formatCurrency(tenToken, currencyCode)})`}
                </button>

                {/* Custom % Button or Inline Input */}
                {isCustomPercentOpen ? (
                  <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-300 px-2.5 py-1 shadow-2xs animate-in fade-in-50 zoom-in-95">
                    <span className="text-[11px] font-bold text-emerald-800">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      placeholder="%"
                      value={percentValue}
                      onChange={(e) => handlePercentInputChange(e.target.value)}
                      className="w-14 text-xs font-black text-emerald-900 bg-white rounded-lg px-2 py-0.5 border border-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                      autoFocus
                    />
                    <span className="text-xs font-black text-emerald-800">%</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomPercentOpen(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-700 ml-1 px-1 cursor-pointer"
                      title="Close custom %"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPercentOpen(true);
                      setAmountMode("percentage");
                    }}
                    className={cn(
                      "clay-tag px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                      isCustomPercentActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                    )}
                  >
                    ⚙️ Custom % {isCustomPercentActive && percentValue ? `(${percentValue}%)` : ""}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Live Settlement Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Settlement Preview
              </span>

              <div className="flex justify-between items-center text-slate-600">
                <span>Paying Now:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(parsedAmount, currencyCode)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
                <span className="font-bold text-slate-700">Remaining Balance:</span>
                <span
                  className={cn(
                    "font-black text-base",
                    remainingBalanceAfter === 0 ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  {formatCurrency(remainingBalanceAfter, currencyCode)}
                  {remainingBalanceAfter === 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 ml-1.5 uppercase">
                      (Fully Settled)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Payment Method, Date & Reference */}
        <div className="clay-card p-6 sm:p-7 space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Payment Method & Transaction Info</span>
          </h2>

          {/* Payment Method Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "upi", label: "UPI / GPay / PhonePe", Icon: Smartphone },
                { id: "bank_transfer", label: "Bank Transfer (NEFT/IMPS)", Icon: Building2 },
                { id: "cash", label: "Cash Payment", Icon: Banknote },
                { id: "cheque", label: "Cheque Deposit", Icon: CreditCard },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.Icon;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={cn(
                      "clay-tag p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs border-slate-900"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-bold text-center leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & UTR Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Transaction Reference / UTR Number</span>
                <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-982348923 or Cheque #102938"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Payment Remarks / Notes</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received 50% advance deposit for event setup..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all font-medium resize-none"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/payments">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !selectedInvoice || parsedAmount <= 0}
            className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? "Recording Settlement..." : "Confirm & Save Receipt"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-card p-12 text-center text-sm font-bold">
          Loading payment form...
        </div>
      }
    >
      <RecordPaymentForm />
    </Suspense>
  );
}
