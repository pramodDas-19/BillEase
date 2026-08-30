"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId") || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId);
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer" | "cash" | "cheque">("upi");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvoices() {
      const data = await InvoiceService.getInvoices();
      setInvoices(data);
      if (!selectedInvoiceId && data.length > 0) {
        setSelectedInvoiceId(data[0].id);
        setAmount(data[0].balanceDue.toString());
      }
    }
    loadInvoices();
  }, []);

  // Update amount when selected invoice changes
  useEffect(() => {
    if (selectedInvoice) {
      setAmount(selectedInvoice.balanceDue.toString());
    }
  }, [selectedInvoiceId, selectedInvoice]);

  const handleQuickPercent = (percent: number) => {
    if (!selectedInvoice) return;
    const calculated = Math.round((selectedInvoice.totalAmount * percent) / 100);
    setAmount(calculated.toString());
  };

  const handleFullBalance = () => {
    if (!selectedInvoice) return;
    setAmount(selectedInvoice.balanceDue.toString());
  };

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
        amount: parseFloat(amount) || 0,
        currency: selectedInvoice.currency || "INR",
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef || undefined,
        notes: notes || undefined,
      });

      router.push("/payments");
    } catch (err) {
      console.error("Failed to record payment:", err);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Record Payment Receipt
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Log client settlements, advance deposits, and generate verified receipts.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="clay-card p-6 sm:p-8 space-y-6">
        {/* Invoice Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Invoice to Settle <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} — {inv.clientName} (Total: {formatCurrency(inv.totalAmount, "INR")} | Due: {formatCurrency(inv.balanceDue, "INR")})
              </option>
            ))}
          </select>

        </div>

        {/* Selected Invoice Financial Banner */}
        {selectedInvoice && (
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-200/80 text-xs">
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
                Previously Paid
              </span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {formatCurrency(selectedInvoice.paidAmount || 0, selectedInvoice.currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Current Balance Due
              </span>
              <span className="font-extrabold text-amber-700 text-sm">
                {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
              </span>
            </div>
          </div>
        )}

        {/* Payment Amount & Quick Amount Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Payment Amount Received (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-2.5 text-sm font-extrabold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Quick Amount Helper Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick Fill:</span>
            <button
              type="button"
              onClick={handleFullBalance}
              className="clay-tag px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Full Balance Due
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(50)}
              className="clay-tag px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              50% Advance
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(20)}
              className="clay-tag px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              20% Token
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Payment Mode <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "upi", label: "UPI / GPay", Icon: Smartphone },
              { id: "bank_transfer", label: "Bank Transfer", Icon: Building2 },
              { id: "cash", label: "Cash", Icon: Banknote },
              { id: "cheque", label: "Cheque", Icon: CreditCard },
            ].map((m) => {
              const isSelected = paymentMethod === m.id;
              const Icon = m.Icon;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={cn(
                    "clay-tag p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer",
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs border-slate-900"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Date & Reference ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Transaction Reference / UTR</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-982348923 or NEFT Ref"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Payment Remarks / Notes</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. 50% advance received before event execution..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
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
            className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirm & Save Receipt</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <Suspense fallback={<div className="clay-card p-12 text-center text-sm font-bold">Loading payment form...</div>}>
      <RecordPaymentForm />
    </Suspense>
  );
}
