"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInvoiceBuilder } from "@/hooks/use-invoice-builder";
import { InvoiceService } from "@/services/invoice.service";
import { ClientService } from "@/services/client.service";
import { Client, Invoice } from "@/types";
import { QuotationItemRow } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useInvoiceBuilder({
    invoiceNumber: "",
    currency: "INR",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, invData] = await Promise.all([
          ClientService.getClients(),
          InvoiceService.getInvoiceById(id),
        ]);

        setClients(clientsData || []);
        setInvoice(invData);

        if (invData) {
          setState({
            invoiceNumber: invData.invoiceNumber,
            quotationId: invData.quotationId,
            quotationNumber: invData.quotationNumber,
            clientId: invData.clientId || "",
            clientName: invData.clientName || "",
            clientEmail: invData.clientEmail || "",
            clientPhone: invData.clientPhone || "",
            clientAddress: invData.clientAddress || "",
            clientGstin: invData.clientGstin || "",
            issueDate: invData.issueDate || new Date().toISOString().split("T")[0],
            dueDate:
              invData.dueDate ||
              new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
            currency: invData.currency || "INR",
            items:
              invData.items && invData.items.length > 0
                ? invData.items.map((i, idx) => ({
                    id: i.id || `inv-item-${Date.now()}-${idx}`,
                    description: i.description || "",
                    detailedNotes: i.detailedNotes || "",
                    hsnSacCode: i.hsnSacCode,
                    quantity: i.quantity,
                    unit: i.unit,
                    rate: i.rate,
                    amount: i.amount || 0,
                    discountType: i.discountType,
                    discountValue: i.discountValue,
                    discountAmount: i.discountAmount,
                    taxRate: i.taxRate,
                  }))
                : [
                    {
                      id: `item-${Date.now()}`,
                      description: "",
                      amount: 0,
                    },
                  ],
            discountType: invData.discountType,
            discountValue: invData.discountValue || 0,
            isTaxEnabled: invData.isTaxEnabled ?? true,
            gstType: invData.gstType || "intra_state",
            defaultTaxRate: invData.taxBreakdown?.[0]?.rate
              ? (invData.gstType === "inter_state" ? invData.taxBreakdown[0].rate : invData.taxBreakdown[0].rate * 2)
              : 18,
            paidAmount: invData.paidAmount || 0,
            termsAndConditions: invData.termsAndConditions || "",
            notes: invData.notes || "",
          });

        }
      } catch (err) {
        console.error("Failed to load invoice for edit:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setState((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientEmail: found.email || "",
        clientPhone: found.phone,
        clientAddress: found.address || (found.billingAddress ? `${found.billingAddress.street}, ${found.billingAddress.city}` : ""),
        clientGstin: found.gstin || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let resolvedClientId = state.clientId;

      if (!resolvedClientId && state.clientName.trim()) {
        const existing = clients.find(
          (c) =>
            c.name.toLowerCase() === state.clientName.trim().toLowerCase() ||
            (state.clientPhone && c.phone === state.clientPhone)
        );
        if (existing) {
          resolvedClientId = existing.id;
        }
      }

      await InvoiceService.updateInvoice(id, {
        ...state,
        clientId: resolvedClientId || undefined,
        status:
          totals.balanceDue <= 0
            ? "paid"
            : state.paidAmount && state.paidAmount > 0
            ? "partially_paid"
            : "due",
        items: state.items.map((i) => ({
          ...i,
          id: i.id,
          description: i.description,
          detailedNotes: i.detailedNotes,
          hsnSacCode: i.hsnSacCode,
          quantity: i.quantity,
          unit: i.unit,
          rate: i.rate,
          amount: i.amount,
          discountType: i.discountType,
          discountValue: i.discountValue,
          discountAmount: i.discountAmount,
          taxRate: i.taxRate,
        })),
        subtotal: totals.subtotal,
        discountType: state.discountType,
        discountValue: state.discountValue,
        discountAmount: totals.discountAmount,
        isTaxEnabled: state.isTaxEnabled,
        gstType: state.gstType,
        defaultTaxRate: state.defaultTaxRate,
        taxBreakdown: totals.taxBreakdown,
        totalTax: totals.totalTax,
        totalAmount: totals.totalAmount,
        paidAmount: state.paidAmount || 0,
        balanceDue: totals.balanceDue,

      });

      router.push("/invoices");
    } catch (err) {
      console.error("Failed to update invoice:", err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
        <Link href="/invoices" className="mt-4 inline-block text-sm text-emerald-600 font-bold">
          ← Return to Invoices
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Edit Invoice #{invoice.invoiceNumber}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Update billed line items, discounts, advance payments, and customer details.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="clay-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Invoice Number *"
                value={state.invoiceNumber}
                onChange={(e) => setState((p) => ({ ...p, invoiceNumber: e.target.value }))}
                required
              />
              <Input
                label="Issue Date *"
                type="date"
                value={state.issueDate}
                onChange={(e) => setState((p) => ({ ...p, issueDate: e.target.value }))}
                required
              />
              <Input
                label="Due Date *"
                type="date"
                value={state.dueDate}
                onChange={(e) => setState((p) => ({ ...p, dueDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Client Selection
              </label>
              <select
                value={state.clientId || ""}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                <option value="">-- Choose Existing Client or Type Below --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} - {c.phone}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Client Name *"
                  placeholder="e.g. Rahul Sharma"
                  value={state.clientName || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientName: e.target.value }))}
                  required
                />
                <Input
                  label="Phone *"
                  placeholder="+91 98765 43210"
                  value={state.clientPhone || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientPhone: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Email"
                  placeholder="client@example.com"
                  value={state.clientEmail || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientEmail: e.target.value }))}
                />
                <Input
                  label="Client GSTIN (Optional)"
                  placeholder="27AAACS1429B1Z5"
                  value={state.clientGstin || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientGstin: e.target.value }))}
                />
              </div>

              <div className="pt-2">
                <Input
                  label="Billing Address"
                  placeholder="Street address, city, state..."
                  value={state.clientAddress || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientAddress: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Invoice Line Items</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Item description required. Quantity, Unit, and Rate are optional.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {state.items.map((item, index) => (
                <QuotationItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  isRemovable={state.items.length > 1}
                  onUpdate={(itemId, updates) => updateItem(itemId, updates)}
                  onRemove={(itemId) => removeItem(itemId)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full text-xs font-bold border-dashed border-slate-300 py-3 rounded-2xl cursor-pointer hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Another Line Item
            </Button>
          </div>

          {/* Terms & Conditions Card */}
          <div className="clay-card p-6 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={state.termsAndConditions}
              onChange={(e) => setState((p) => ({ ...p, termsAndConditions: e.target.value }))}
              placeholder="Payment terms, bank details, return policy..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* Right 1 Col: Financial Summary Card */}
        <div className="space-y-6">
          <Card className="clay-card p-6 space-y-4 sticky top-20">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Invoice Calculations
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Subtotal</span>
                <span className="font-extrabold text-slate-900">
                  {formatCurrency(totals.subtotal, state.currency)}
                </span>
              </div>

              {/* Discount Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">Discount</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="0"
                      value={state.discountValue || ""}
                      onChange={(e) =>
                        setState((p) => ({
                          ...p,
                          discountType: "percentage",
                          discountValue: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-600 pl-2">
                    <span>Discount Applied</span>
                    <span className="font-bold">
                      -{formatCurrency(totals.discountAmount, state.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* GST Toggle & Smart Split Controls */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.isTaxEnabled}
                      onChange={(e) => setState((p) => ({ ...p, isTaxEnabled: e.target.checked }))}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">
                      Apply GST / Tax
                    </span>
                  </label>
                  {state.isTaxEnabled && (
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {state.defaultTaxRate}% Total
                    </span>
                  )}
                </div>

                {state.isTaxEnabled && (
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 animate-in fade-in-50 duration-200">
                    {/* GST Rate Quick Selection */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tax Rate (%)
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {[5, 12, 18, 28].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setState((p) => ({ ...p, defaultTaxRate: rate }))}
                            className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              state.defaultTaxRate === rate
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intra-State vs Inter-State Pill Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tax Destination
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/70 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setState((p) => ({ ...p, gstType: "intra_state" }))}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                            state.gstType === "intra_state"
                              ? "bg-white text-emerald-800 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Within State (CGST + SGST)
                        </button>
                        <button
                          type="button"
                          onClick={() => setState((p) => ({ ...p, gstType: "inter_state" }))}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                            state.gstType === "inter_state"
                              ? "bg-white text-emerald-800 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Out of State (IGST)
                        </button>
                      </div>
                    </div>

                    {/* Calculated Tax Breakdown Display */}
                    <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                      {totals.taxBreakdown.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">{t.name}:</span>
                          <span className="font-bold text-slate-900">
                            +{formatCurrency(t.amount, state.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="font-extrabold text-slate-900">Total Invoiced:</span>
                <span className="font-black text-slate-900 text-base">
                  {formatCurrency(totals.totalAmount, state.currency)}
                </span>
              </div>

              {/* Advance Paid Deposit */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Advance Paid Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={state.paidAmount || ""}
                  onChange={(e) =>
                    setState((p) => ({ ...p, paidAmount: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Balance Due */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Balance Due</span>
                <span className="font-black text-lg text-emerald-800">
                  {formatCurrency(totals.balanceDue, state.currency)}
                </span>
              </div>

              {/* Action Buttons Block inside Card */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting || state.items.length === 0}
                  className="clay-btn-emerald w-full flex items-center justify-center gap-2 h-11 px-5 font-bold text-sm rounded-2xl cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? "Updating Invoice..." : "Save Changes"}</span>
                </button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/invoices")}
                  className="w-full rounded-xl text-xs font-bold cursor-pointer h-10 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
