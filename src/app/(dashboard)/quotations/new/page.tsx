"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuotationBuilder } from "@/hooks/use-quotation-builder";
import { useTenant } from "@/hooks/use-tenant";
import { ClientService } from "@/services/client.service";
import { QuotationService } from "@/services/quotation.service";
import { CatalogService } from "@/services/service.service";
import { Client } from "@/types";
import { QuotationItemRow } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";

function NewQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useTenant();

  const preSelectedClientId = searchParams.get("clientId");
  const preSelectedServiceId = searchParams.get("serviceId");

  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useQuotationBuilder({
    quotationNumber: `${currentTenant?.settings?.quotationNumbering?.prefix || "QT-"}${
      currentTenant?.settings?.quotationNumbering?.nextNumber || 1001
    }`,
    currency: currentTenant?.settings?.defaultCurrency || "INR",
    isTaxEnabled: currentTenant?.settings?.enableGstByDefault ?? false,
    defaultTaxRate: currentTenant?.settings?.defaultTaxRate || 18,
    termsAndConditions: currentTenant?.settings?.defaultTermsAndConditions || "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, quotesData, servicesData] = await Promise.all([
          ClientService.getClients(),
          QuotationService.getQuotations(),
          CatalogService.getServices(),
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

        // If preSelectedServiceId is present, prefill with service item
        if (preSelectedServiceId && servicesData) {
          const srv = servicesData.find((s) => s.id === preSelectedServiceId);
          if (srv) {
            const sRate = srv.rate !== undefined ? srv.rate : (srv.defaultRate ?? 0);
            const sGst = srv.gstRate !== undefined ? srv.gstRate : (srv.defaultTaxRate ?? 18);
            setState((prev) => ({
              ...prev,
              quotationNumber: `${prefix}${nextNum}`,
              items: [
                {
                  id: `item-${Date.now()}`,
                  description: srv.name,
                  detailedNotes: srv.description || "",
                  quantity: 1,
                  unit: srv.unit || srv.defaultUnit || "",
                  rate: sRate,
                  amount: sRate,
                },
              ],
              defaultTaxRate: sGst,
              isTaxEnabled: sGst > 0,
            }));
            return;
          }
        }

        // If preSelectedClientId is present, prefill client
        if (preSelectedClientId && clientsData) {
          const client = clientsData.find((c) => c.id === preSelectedClientId);
          if (client) {
            setState((prev) => ({
              ...prev,
              quotationNumber: `${prefix}${nextNum}`,
              clientId: client.id,
              clientName: client.name,
              clientEmail: client.email || "",
              clientPhone: client.phone,
              clientAddress: client.address || "",
              clientGstin: client.gstin || "",
            }));
            return;
          }
        }

        setState((prev) => ({
          ...prev,
          quotationNumber: `${prefix}${nextNum}`,
        }));
      } catch (err) {
        console.error("Failed to load quotation initial data:", err);
      }
    }
    loadData();
  }, [preSelectedClientId, preSelectedServiceId, currentTenant]);

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

      // Auto create client if not picked from dropdown
      if (!resolvedClientId && state.clientName.trim()) {
        const existing = clients.find(
          (c) =>
            c.name.toLowerCase() === state.clientName.trim().toLowerCase() ||
            (state.clientPhone && c.phone === state.clientPhone)
        );

        if (existing) {
          resolvedClientId = existing.id;
        } else {
          try {
            const newClient = await ClientService.createClient({
              name: state.clientName.trim(),
              phone: state.clientPhone || "",
              email: state.clientEmail || undefined,
              address: state.clientAddress || undefined,
              gstin: state.clientGstin || undefined,
              totalBilled: 0,
              totalPaid: 0,
              balanceDue: 0,
            });
            if (newClient) {
              resolvedClientId = newClient.id;
            }
          } catch (cErr) {
            console.warn("Could not auto-create client for quotation:", cErr);
          }
        }
      }

      await QuotationService.createQuotation({
        ...state,
        clientId: resolvedClientId || undefined,
        status: "draft",
        validUntil: state.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
      console.error("Failed to create quotation:", err);
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Create New Quotation</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Create an official estimate with itemized pricing, GST, and terms.
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
            <span>{isSubmitting ? "Saving..." : "Save Quotation"}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split Layout: Same as Invoices */}
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
                  onUpdate={(id, updates) => updateItem(id, updates)}
                  onRemove={(id) => removeItem(id)}
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

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <NewQuotationContent />
    </Suspense>
  );
}
