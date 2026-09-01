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
import { QuotationItemRow, QuotationSummary } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
        }
      }

      await QuotationService.createQuotation({
        ...state,
        clientId: resolvedClientId || undefined,
        status: "draft",
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in-50 duration-200">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              New Quotation
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
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-xl font-bold text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || state.items.length === 0}
            className="clay-btn-emerald rounded-2xl font-bold text-xs sm:text-sm px-6 h-11 cursor-pointer"
          >
            <Save className="h-4 w-4 mr-2" />
            <span>{isSubmitting ? "Creating Quote..." : "Save & Create Quote"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quotation Header & Client Information */}
        <Card className="clay-card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Estimate Number
              </span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {state.quotationNumber}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Quick Client Pick:</span>
              <select
                onChange={(e) => handleClientSelect(e.target.value)}
                value={state.clientId || ""}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="">-- Choose Existing Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Ramesh Patel"
                required
                value={state.clientName}
                onChange={(e) => setState((prev) => ({ ...prev, clientName: e.target.value }))}
                className="font-semibold text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                WhatsApp Phone <span className="text-rose-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                required
                value={state.clientPhone}
                onChange={(e) => setState((prev) => ({ ...prev, clientPhone: e.target.value }))}
                className="font-semibold text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="client@domain.com"
                value={state.clientEmail}
                onChange={(e) => setState((prev) => ({ ...prev, clientEmail: e.target.value }))}
                className="font-semibold text-xs sm:text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Billing Address
              </label>
              <Input
                type="text"
                placeholder="Street address, city, state..."
                value={state.clientAddress}
                onChange={(e) => setState((prev) => ({ ...prev, clientAddress: e.target.value }))}
                className="font-semibold text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Client GSTIN (optional)
              </label>
              <Input
                type="text"
                placeholder="27AAAAA0000A1Z5"
                value={state.clientGstin}
                onChange={(e) => setState((prev) => ({ ...prev, clientGstin: e.target.value.toUpperCase() }))}
                className="font-semibold text-xs sm:text-sm rounded-xl uppercase"
              />
            </div>
          </div>
        </Card>

        {/* Quotation Line Items Card */}
        <Card className="clay-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Line Items & Services
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="rounded-xl font-bold text-xs text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Line Item</span>
            </Button>
          </div>

          <div className="space-y-3">
            {state.items.map((item, index) => (
              <QuotationItemRow
                key={item.id}
                item={item}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
                isRemovable={state.items.length > 1}
              />
            ))}
          </div>
        </Card>

        {/* Financial Totals & Summary */}
        <QuotationSummary
          subtotal={totals.subtotal}
          discountType={state.discountType}
          discountValue={state.discountValue}
          discountAmount={totals.discountAmount}
          onDiscountChange={(type: "percentage" | "fixed" | undefined, value: number) =>
            setState((prev) => ({ ...prev, discountType: type, discountValue: value }))
          }
          isTaxEnabled={state.isTaxEnabled}
          onTaxToggle={(enabled: boolean) => setState((prev) => ({ ...prev, isTaxEnabled: enabled }))}
          taxRate={state.defaultTaxRate}
          onTaxRateChange={(rate: number) => setState((prev) => ({ ...prev, defaultTaxRate: rate }))}
          totalTax={totals.totalTax}
          totalAmount={totals.totalAmount}
          currency={state.currency}
        />

        {/* Terms & Notes Card */}
        <Card className="clay-card p-6 sm:p-7 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={state.termsAndConditions}
              onChange={(e) => setState((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
              placeholder="e.g. 50% advance required to confirm booking..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs resize-none"
            />
          </div>
        </Card>
      </form>
    </div>
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
