"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuotationBuilder } from "@/hooks/use-quotation-builder";
import { QuotationService } from "@/services/quotation.service";
import { ClientService } from "@/services/client.service";
import { Client, Quotation } from "@/types";
import { QuotationItemRow } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";

export default function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useQuotationBuilder({
    quotationNumber: "",
    currency: "INR",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, quoteData] = await Promise.all([
          ClientService.getClients(),
          QuotationService.getQuotationById(id),
        ]);

        setClients(clientsData || []);
        setQuote(quoteData);

        if (quoteData) {
          setState({
            quotationNumber: quoteData.quotationNumber,
            clientId: quoteData.clientId || "",
            clientName: quoteData.clientName || "",
            clientEmail: quoteData.clientEmail || "",
            clientPhone: quoteData.clientPhone || "",
            clientAddress: quoteData.clientAddress || "",
            clientGstin: quoteData.clientGstin || "",
            date: quoteData.date || new Date().toISOString().split("T")[0],
            validUntil:
              quoteData.validUntil ||
              new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
            currency: quoteData.currency || "INR",
            items:
              quoteData.items && quoteData.items.length > 0
                ? quoteData.items.map((i, idx) => ({
                    id: i.id || `qi-${Date.now()}-${idx}`,
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
            discountType: quoteData.discountType,
            discountValue: quoteData.discountValue || 0,
            isTaxEnabled: quoteData.isTaxEnabled ?? true,
            defaultTaxRate: 18,
            termsAndConditions: quoteData.termsAndConditions || "",
            notes: quoteData.notes || "",
          });
        }
      } catch (err) {
        console.error("Failed to load quotation for edit:", err);
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

      await QuotationService.updateQuotation(id, {
        ...state,
        clientId: resolvedClientId || undefined,
        items: state.items.map((it) => ({
          ...it,
          amount: it.amount || (it.quantity || 1) * (it.rate || 0),
        })),
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
      });

      router.push("/quotations");
    } catch (err) {
      console.error("Failed to update quotation:", err);
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

  if (!quote) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Quotation Not Found</h2>
        <Link href="/quotations" className="mt-4 inline-block text-sm text-emerald-600 font-bold">
          ← Return to Quotations
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Edit Quotation #{quote.quotationNumber}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Modify quotation line items, pricing, GST, client details, and terms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/quotations")}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting || state.items.length === 0}
            className="clay-btn-emerald inline-flex items-center gap-2 h-10 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Updating..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client & Line Items & Terms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Client Details Card */}
          <div className="clay-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Quotation Number *"
                value={state.quotationNumber}
                onChange={(e) => setState((p) => ({ ...p, quotationNumber: e.target.value }))}
                required
              />
              <Input
                label="Quote Date *"
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
                <h3 className="font-bold text-slate-900 text-sm">Quotation Line Items</h3>
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

          {/* Terms & Notes Card */}
          <div className="clay-card p-6 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={state.termsAndConditions}
              onChange={(e) => setState((p) => ({ ...p, termsAndConditions: e.target.value }))}
              placeholder="e.g. 50% advance required to confirm booking..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* Right 1 Col: Financial Summary Card */}
        <div className="space-y-6">
          <Card className="clay-card p-6 space-y-4 sticky top-20">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Quotation Calculations
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

              {/* GST Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.isTaxEnabled}
                    onChange={(e) => setState((p) => ({ ...p, isTaxEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Estimated Total</span>
                <span className="font-black text-lg text-emerald-800">
                  {formatCurrency(totals.totalAmount, state.currency)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
