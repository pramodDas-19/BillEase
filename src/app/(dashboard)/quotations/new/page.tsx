"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuotationBuilder } from "@/hooks/use-quotation-builder";
import { useTenant } from "@/hooks/use-tenant";
import { ClientService } from "@/services/client.service";
import { QuotationService } from "@/services/quotation.service";
import { Client } from "@/types";
import { QuotationItemRow, QuotationSummary } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Save } from "lucide-react";

export default function NewQuotationPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [clientsData, quotesData] = await Promise.all([
        ClientService.getClients(),
        QuotationService.getQuotations(),
      ]);
      setClients(clientsData || []);

      // Calculate next quotation number from database
      const prefix = currentTenant?.settings?.quotationNumbering?.prefix || "QT-";
      let nextNum = 1001;
      if (quotesData && quotesData.length > 0) {
        const numbers = quotesData.map((q) => {
          const match = q.quotationNumber.match(/\d+$/);
          return match ? parseInt(match[0], 10) : 0;
        });
        nextNum = Math.max(...numbers, 1000) + 1;
      }

      setState((prev) => ({
        ...prev,
        quotationNumber: `${prefix}${nextNum}`,
      }));
    }
    loadData();
  }, [currentTenant]);


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
      let finalClientId = state.clientId;
      if (!finalClientId && state.clientName) {
        const existing = clients.find(
          (c) =>
            c.name.toLowerCase() === state.clientName.toLowerCase() ||
            (state.clientPhone &&
              c.phone.replace(/\D/g, "") === state.clientPhone.replace(/\D/g, ""))
        );
        if (existing) {
          finalClientId = existing.id;
        } else {
          try {
            const newClient = await ClientService.createClient({
              name: state.clientName,
              phone: state.clientPhone || "+91 00000 00000",
              email: state.clientEmail || undefined,
              address: state.clientAddress || undefined,
              gstin: state.clientGstin || undefined,
            });
            if (newClient) {
              finalClientId = newClient.id;
            }
          } catch (cErr) {
            console.warn("Could not auto-create client:", cErr);
          }
        }
      }

      await QuotationService.createQuotation({
        quotationNumber: state.quotationNumber,
        clientId: finalClientId || undefined,
        clientName: state.clientName,
        clientEmail: state.clientEmail || undefined,
        clientPhone: state.clientPhone || undefined,
        clientAddress: state.clientAddress || undefined,
        clientGstin: state.clientGstin || undefined,

        date: state.date,
        validUntil: state.validUntil,
        status: "sent",
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
        termsAndConditions: state.termsAndConditions,
        notes: state.notes,
      });

      router.push("/quotations");
    } catch (err) {
      console.error("Failed to save quotation:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Create New Quotation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Build estimates, apply optional discounts & GST, and send via WhatsApp/PDF.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/quotations")}
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
            <span>{isSubmitting ? "Saving..." : "Save Quotation"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client, Dates, Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="clay-card p-6 space-y-4">
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
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Client Selection
              </label>
              <select
                value={state.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
          </div>

          {/* Line Items Card */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Quotation Line Items</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Item description required. Quantity, Unit, and Rate are optional.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="text-xs font-bold rounded-xl">
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

            <button
              type="button"
              onClick={addItem}
              className="clay-tag w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Add Another Line Item</span>
            </button>
          </div>

          {/* Notes & Terms */}
          <div className="clay-card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={state.termsAndConditions}
                onChange={(e) => setState((p) => ({ ...p, termsAndConditions: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Client Note / Message
              </label>
              <textarea
                rows={2}
                placeholder="Custom greetings or remarks..."
                value={state.notes}
                onChange={(e) => setState((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none font-medium"
              />
            </div>
          </div>
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
