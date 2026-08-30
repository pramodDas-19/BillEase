"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoiceBuilder } from "@/hooks/use-invoice-builder";
import { useTenant } from "@/hooks/use-tenant";
import { MOCK_CLIENTS } from "@/mock/clients.mock";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { QuotationItemRow } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_DOCUMENT_CONFIG } from "@/config/document.config";
import { ArrowLeft, Plus, Save } from "lucide-react";

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useTenant();

  const fromQuoteId = searchParams.get("fromQuote");
  const initialQuote = fromQuoteId ? MOCK_QUOTATIONS.find((q) => q.id === fromQuoteId) : undefined;

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useInvoiceBuilder({
    invoiceNumber: `${currentTenant.settings.invoiceNumbering.prefix}${currentTenant.settings.invoiceNumbering.nextNumber}`,
    quotationId: initialQuote?.id,
    quotationNumber: initialQuote?.quotationNumber,
    clientId: initialQuote?.clientId,
    clientName: initialQuote?.clientName,
    clientEmail: initialQuote?.clientEmail,
    clientPhone: initialQuote?.clientPhone,
    clientAddress: initialQuote?.clientAddress,
    clientGstin: initialQuote?.clientGstin,
    currency: initialQuote?.currency || currentTenant.settings.defaultCurrency,
    items: initialQuote?.items || [
      {
        id: `item-${Date.now()}`,
        description: "",
        amount: 0,
      },
    ],
    discountType: initialQuote?.discountType,
    discountValue: initialQuote?.discountValue || 0,
    isTaxEnabled: initialQuote?.isTaxEnabled ?? currentTenant.settings.enableGstByDefault,
    defaultTaxRate: initialQuote?.taxBreakdown?.[0]?.rate || currentTenant.settings.defaultTaxRate || 18,
    termsAndConditions: initialQuote?.termsAndConditions || currentTenant.settings.defaultTermsAndConditions,
  });

  const handleClientSelect = (clientId: string) => {
    const found = MOCK_CLIENTS.find((c) => c.id === clientId);
    if (found) {
      setState((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientEmail: found.email || "",
        clientPhone: found.phone,
        clientAddress: found.billingAddress
          ? `${found.billingAddress.street}, ${found.billingAddress.city}`
          : "",
        clientGstin: found.gstin || "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/invoices");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {initialQuote ? `Generate Invoice from #${initialQuote.quotationNumber}` : "Create New Invoice"}
            </h1>
            <p className="text-xs text-slate-500">
              Set line items, tax, payment due date, and record advance payments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/invoices")}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            <span>Save Invoice</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
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

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Client</label>
              <select
                value={state.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Client --</option>
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} - {c.phone}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Input
                  label="Client Name *"
                  value={state.clientName}
                  onChange={(e) => setState((p) => ({ ...p, clientName: e.target.value }))}
                  required
                />
                <Input
                  label="Phone *"
                  value={state.clientPhone}
                  onChange={(e) => setState((p) => ({ ...p, clientPhone: e.target.value }))}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Line Items Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Invoice Line Items</h3>
                <p className="text-[11px] text-slate-500">Manual descriptions supported.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {state.items.map((item, idx) => (
                <QuotationItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  isRemovable={state.items.length > 1}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Summary */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Invoice Calculations
            </h4>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(totals.subtotal, state.currency)}</span>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.isTaxEnabled}
                  onChange={(e) => setState((p) => ({ ...p, isTaxEnabled: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Apply GST (18%)</span>
              </label>
              {state.isTaxEnabled && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tax Amount:</span>
                  <span>+{formatCurrency(totals.totalTax, state.currency)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Invoiced:</span>
              <span>{formatCurrency(totals.totalAmount, state.currency)}</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-700">Advance Paid Amount</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={state.paidAmount || ""}
                onChange={(e) => setState((p) => ({ ...p, paidAmount: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Balance Due</span>
              <span className="text-xl font-extrabold text-amber-700">
                {formatCurrency(totals.balanceDue, state.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div>Loading invoice builder...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
