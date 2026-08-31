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
                    quantity: i.quantity,
                    unit: i.unit,
                    rate: i.rate,
                    amount: i.amount || 0,
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
            defaultTaxRate: 18,
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
        clientAddress:
          found.address ||
          (found.billingAddress
            ? `${found.billingAddress.street}, ${found.billingAddress.city}`
            : ""),
        clientGstin: found.gstin || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Delete and re-create invoice with updated calculations
      await InvoiceService.deleteInvoice(id);
      await InvoiceService.createInvoice({
        id,
        invoiceNumber: state.invoiceNumber,
        quotationId: state.quotationId,
        quotationNumber: state.quotationNumber,
        clientId: state.clientId || undefined,
        clientName: state.clientName,
        clientEmail: state.clientEmail || undefined,
        clientPhone: state.clientPhone || undefined,
        clientAddress: state.clientAddress || undefined,
        clientGstin: state.clientGstin || undefined,
        issueDate: state.issueDate,
        dueDate: state.dueDate,
        status:
          totals.balanceDue <= 0
            ? "paid"
            : state.paidAmount && state.paidAmount > 0
            ? "partially_paid"
            : "due",
        currency: state.currency,
        items: state.items.map((i) => ({
          id: i.id,
          description: i.description,
          detailedNotes: i.detailedNotes,
          quantity: i.quantity,
          unit: i.unit,
          rate: i.rate,
          amount: i.amount,
        })),
        subtotal: totals.subtotal,
        discountType: state.discountType,
        discountValue: state.discountValue,
        discountAmount: totals.discountAmount,
        isTaxEnabled: state.isTaxEnabled,
        totalTax: totals.totalTax,
        totalAmount: totals.totalAmount,
        paidAmount: state.paidAmount || 0,
        balanceDue: totals.balanceDue,
        termsAndConditions: state.termsAndConditions,
        notes: state.notes,
      });

      router.push(`/invoices/${id}`);
    } catch (err) {
      console.error("Failed to update invoice:", err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading Invoice Editor...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
        <Link
          href="/invoices"
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
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
            href={`/invoices/${id}`}
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Edit Tax Invoice #{invoice.invoiceNumber}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Editing
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Modify line items, advance deductions, and client details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/invoices/${id}`)}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="clay-btn-emerald inline-flex items-center gap-2 h-10 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving..." : "Save Invoice"}</span>
          </button>
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="">-- Choose Existing Client or Edit Below --</option>
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
            </div>
          </div>

          {/* Line Items Card */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Invoice Line Items</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Pick from catalog or customize item rates and quantities.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                className="text-xs font-bold rounded-xl"
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
                  onUpdate={(id, updates) => updateItem(id, updates)}
                  onRemove={(id) => removeItem(id)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full text-xs font-bold border-dashed border-slate-300 py-3 rounded-2xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Another Line Item
            </Button>
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

              {/* GST Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.isTaxEnabled}
                    onChange={(e) => setState((p) => ({ ...p, isTaxEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">
                    Apply GST ({state.defaultTaxRate || 18}%)
                  </span>
                </label>
                {state.isTaxEnabled && (
                  <div className="flex justify-between items-center text-slate-600 mt-2 pl-6">
                    <span>GST Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(totals.totalTax, state.currency)}
                    </span>
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
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
