"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
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
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer" | "cash" | "cheque">("upi");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
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
    setIsInvoiceDropdownOpen(false);
    setInvoiceSearchQuery("");
  };

  const handleQuickPercent = (percent: number) => {
    if (!selectedInvoice) return;
    const calculated = Math.round((selectedInvoice.totalAmount * percent) / 100);
    setAmount(calculated.toString());
  };

  const handleFullBalance = () => {
    if (!selectedInvoice) return;
    setAmount(selectedInvoice.balanceDue.toString());
  };

  // Live settlement calculation
  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = selectedInvoice ? selectedInvoice.balanceDue : 0;
  const remainingBalanceAfter = Math.max(0, currentBalance - parsedAmount);

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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Amount Received (₹) <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-lg font-black text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all"
                />
              </div>

              {/* Quick Fill Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-bold">Quick Fill:</span>
                <button
                  type="button"
                  onClick={handleFullBalance}
                  className="clay-tag px-3 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Full Due ({formatCurrency(currentBalance, "INR")})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className="clay-tag px-3 py-1 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  50% Advance
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(20)}
                  className="clay-tag px-3 py-1 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  20% Token
                </button>
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
                  {formatCurrency(parsedAmount, "INR")}
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
                  {formatCurrency(remainingBalanceAfter, "INR")}
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
