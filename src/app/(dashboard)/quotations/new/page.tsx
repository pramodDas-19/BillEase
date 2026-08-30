"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuotationBuilder } from "@/hooks/use-quotation-builder";
import { useTenant } from "@/hooks/use-tenant";
import { MOCK_CLIENTS } from "@/mock/clients.mock";
import { QuotationItemRow, QuotationSummary } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Save, Eye } from "lucide-react";

export default function NewQuotationPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useQuotationBuilder({
    quotationNumber: `${currentTenant.settings.quotationNumbering.prefix}${currentTenant.settings.quotationNumbering.nextNumber}`,
    currency: currentTenant.settings.defaultCurrency,
    isTaxEnabled: currentTenant.settings.enableGstByDefault,
    defaultTaxRate: currentTenant.settings.defaultTaxRate || 18,
    termsAndConditions: currentTenant.settings.defaultTermsAndConditions,
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
    // In production, saves via QuotationService / API
    router.push("/quotations");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create New Quotation
            </h1>
            <p className="text-xs text-slate-500">
              Simple by default. Add quantities, rates, or taxes only if needed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/quotations")}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            <span>Save Quotation</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client, Dates, Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <Card className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Quotation Number *"
                value={state.quotationNumber}
                onChange={(e) => setState((p) => ({ ...p, quotationNumber: e.target.value }))}
                required
              />
              <Input
                label="Issue Date *"
                type="date"
                value={state.date}
                onChange={(e) => setState((p) => ({ ...p, date: e.target.value }))}
                required
              />
              <Input
                label="Valid Until *"
                type="date"
                value={state.validUntil}
                onChange={(e) => setState((p) => ({ ...p, validUntil: e.target.value }))}
                required
              />
            </div>

            {/* Client Picker / Direct inputs */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Client Selection</label>
              <select
                value={state.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Existing Client or Enter Below --</option>
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} - {c.phone}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Input
                  label="Client Name *"
                  placeholder="Client / Company Name"
                  value={state.clientName}
                  onChange={(e) => setState((p) => ({ ...p, clientName: e.target.value }))}
                  required
                />
                <Input
                  label="Phone / WhatsApp *"
                  placeholder="+91 98765 43210"
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
                <h3 className="font-bold text-slate-900 text-sm">Quotation Line Items</h3>
                <p className="text-[11px] text-slate-500">
                  Manual description always enabled. Quantity/Unit/Rate are optional.
                </p>
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full text-xs border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Another Line Item
            </Button>
          </Card>

          {/* Notes & Terms */}
          <Card className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Terms & Conditions</label>
              <textarea
                rows={3}
                value={state.termsAndConditions}
                onChange={(e) => setState((p) => ({ ...p, termsAndConditions: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Client Note / Message</label>
              <textarea
                rows={2}
                placeholder="Custom greetings or remarks..."
                value={state.notes}
                onChange={(e) => setState((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Summary & Totals */}
        <div>
          <div className="sticky top-20">
            <QuotationSummary
              subtotal={totals.subtotal}
              discountType={state.discountType}
              discountValue={state.discountValue}
              discountAmount={totals.discountAmount}
              onDiscountChange={(type, val) =>
                setState((p) => ({ ...p, discountType: type, discountValue: val }))
              }
              isTaxEnabled={state.isTaxEnabled}
              onTaxToggle={(enabled) => setState((p) => ({ ...p, isTaxEnabled: enabled }))}
              taxRate={state.defaultTaxRate}
              onTaxRateChange={(rate) => setState((p) => ({ ...p, defaultTaxRate: rate }))}
              taxBreakdown={totals.taxBreakdown}
              totalTax={totals.totalTax}
              totalAmount={totals.totalAmount}
              currency={state.currency}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
