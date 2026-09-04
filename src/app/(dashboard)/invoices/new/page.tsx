"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoiceBuilder } from "@/hooks/use-invoice-builder";
import { useTenant } from "@/hooks/use-tenant";
import { ClientService } from "@/services/client.service";
import { QuotationService } from "@/services/quotation.service";
import { InvoiceService } from "@/services/invoice.service";
import { CatalogService } from "@/services/service.service";
import { Client, Quotation, CurrencyCode } from "@/types";
import { QuotationItemRow } from "@/components/quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { CURRENCIES } from "@/constants/currencies";
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Eye,
  X,
  Sparkles,
  Globe,
} from "lucide-react";
import { ClientSearchCombobox } from "@/components/clients/client-search-combobox";
import { InvoicePrintDocument } from "@/components/documents/invoice-print-document";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

const STANDARD_INVOICE_TERMS_PRESETS = [
  { label: "Due on Receipt", text: "Payment is due immediately upon receipt of this tax invoice." },
  { label: "Net 15 Days", text: "Payment is due within 15 days from the date of this invoice." },
  { label: "Net 30 Days", text: "Payment is due within 30 days from the date of this invoice." },
  { label: "Late Fee 18%", text: "Interest @ 18% p.a. will be charged on all payments delayed beyond the due date." },
  { label: "Bank Remittance", text: "Please remit all payments via NEFT/RTGS/IMPS/UPI to the designated company bank account." },
];

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useTenant();

  const fromQuoteId =
    searchParams.get("quotationId") ||
    searchParams.get("fromQuoteId") ||
    searchParams.get("fromQuote");
  const preSelectedClientId = searchParams.get("clientId");
  const preSelectedServiceId = searchParams.get("serviceId");

  const [clients, setClients] = useState<Client[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [sourceQuote, setSourceQuote] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!fromQuoteId);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  } = useInvoiceBuilder({
    invoiceNumber: `${currentTenant?.settings?.invoiceNumbering?.prefix || "INV-"}${
      currentTenant?.settings?.invoiceNumbering?.nextNumber || 1001
    }`,
    quotationId: undefined,
    quotationNumber: undefined,
    clientId: preSelectedClientId || undefined,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientGstin: "",
    currency: currentTenant?.settings?.defaultCurrency || "INR",
    items: [
      {
        id: `item-${Date.now()}`,
        description: "",
        amount: 0,
      },
    ],
    discountType: undefined,
    discountValue: 0,
    isTaxEnabled: currentTenant?.settings?.enableGstByDefault ?? false,
    defaultTaxRate: currentTenant?.settings?.defaultTaxRate || 18,
    termsAndConditions: currentTenant?.settings?.defaultTermsAndConditions || "",
    isRoundOffEnabled: false,
  });

  // Auto-detect Indian state from GSTIN
  const detectStateFromGstin = (gstin?: string) => {
    if (!gstin || gstin.trim().length < 2) return null;
    const code = gstin.trim().slice(0, 2);
    const stateName = GST_STATE_CODES[code];
    if (!stateName) return null;

    const tenantGstin = currentTenant?.gstin || "";
    const tenantCode = tenantGstin.trim().length >= 2 ? tenantGstin.trim().slice(0, 2) : "27";
    const isSameState = code === tenantCode;

    return {
      code,
      stateName,
      isSameState,
      suggestedGstType: isSameState ? ("intra_state" as const) : ("inter_state" as const),
    };
  };

  const detectedStateInfo = detectStateFromGstin(state.clientGstin);

  const applyDueDays = (days: number) => {
    const base = state.issueDate ? new Date(state.issueDate) : new Date();
    const future = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setState((p) => ({ ...p, dueDate: future.toISOString().split("T")[0] }));
  };

  const isActiveDuePreset = (days: number) => {
    if (!state.issueDate || !state.dueDate) return false;
    const base = new Date(state.issueDate).getTime();
    const due = new Date(state.dueDate).getTime();
    const diffDays = Math.round((due - base) / (1000 * 60 * 60 * 24));
    return diffDays === days;
  };

  const insertTermClause = (clause: string) => {
    setState((p) => {
      const current = p.termsAndConditions.trim();
      if (!current) return { ...p, termsAndConditions: clause };
      if (current.includes(clause)) return p;
      return { ...p, termsAndConditions: `${current}\n• ${clause}` };
    });
  };

  const insertAllStandardTerms = () => {
    const combined = STANDARD_INVOICE_TERMS_PRESETS.map((p) => `• ${p.text}`).join("\n");
    setState((p) => {
      const current = p.termsAndConditions.trim();
      return {
        ...p,
        termsAndConditions: current ? `${current}\n${combined}` : combined,
      };
    });
  };

  // Determine if there are unsaved changes
  const isDirty = useMemo(() => {
    if (Boolean(state.clientId || state.clientName.trim())) return true;
    if (state.items.length > 1) return true;
    const firstItem = state.items[0];
    if (firstItem) {
      if (firstItem.description && firstItem.description.trim() !== "") return true;
      const rate = firstItem.rate || firstItem.amount || 0;
      if (rate > 0) return true;
    }
    if (state.notes && state.notes.trim() !== "") return true;
    const defaultTerms = currentTenant?.settings?.defaultTermsAndConditions || "";
    if (state.termsAndConditions && state.termsAndConditions.trim() !== defaultTerms.trim()) return true;
    return false;
  }, [state, currentTenant]);

  const {
    showWarningModal,
    confirmLeave,
    cancelLeave,
    bypassWarning,
    navigateWithGuard,
  } = useUnsavedChanges({
    isDirty,
    isSubmitting,
    documentType: "invoice",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, quotesData, invoicesData, servicesData] = await Promise.all([
          ClientService.getClients(),
          QuotationService.getQuotations(),
          InvoiceService.getInvoices(),
          CatalogService.getServices(),
        ]);
        setClients(clientsData || []);
        setQuotations(quotesData || []);

        // Calculate next invoice number from database
        const prefix = currentTenant?.settings?.invoiceNumbering?.prefix || "INV-";
        let nextNum = 1001;
        if (invoicesData && invoicesData.length > 0) {
          const numbers = invoicesData.map((inv) => {
            const match = inv.invoiceNumber.match(/\d+$/);
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
              invoiceNumber: `${prefix}${nextNum}`,
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

        // If fromQuoteId is present, fetch the full quotation details
        if (fromQuoteId) {
          const quote =
            (quotesData || []).find((q) => q.id === fromQuoteId) ||
            (await QuotationService.getQuotationById(fromQuoteId));

          if (quote) {
            setSourceQuote(quote);

            // Populate all state from quotation
            const detection = detectStateFromGstin(quote.clientGstin);
            setState((prev) => ({
              ...prev,
              invoiceNumber: `${prefix}${nextNum}`,
              quotationId: quote.id,
              quotationNumber: quote.quotationNumber,
              clientId: quote.clientId || prev.clientId,
              clientName: quote.clientName || "",
              clientCompanyName: quote.clientCompanyName || "",
              clientPan: quote.clientPan || "",
              clientEmail: quote.clientEmail || "",
              clientPhone: quote.clientPhone || "",
              clientAddress: quote.clientAddress || "",
              clientGstin: quote.clientGstin || "",
              currency: quote.currency || prev.currency,
              items:
                quote.items && quote.items.length > 0
                  ? quote.items.map((item, idx) => ({
                      id: item.id || `qi-${Date.now()}-${idx}`,
                      description: item.description || "",
                      detailedNotes: item.detailedNotes || "",
                      hsnSacCode: item.hsnSacCode,
                      quantity: item.quantity,
                      unit: item.unit,
                      rate: item.rate,
                      amount: item.amount || 0,
                    }))
                  : prev.items,
              discountType: quote.discountType,
              discountValue: quote.discountValue || 0,
              isTaxEnabled: quote.isTaxEnabled ?? prev.isTaxEnabled,
              gstType: detection ? detection.suggestedGstType : (quote.gstType || prev.gstType),
              defaultTaxRate: quote.defaultTaxRate || prev.defaultTaxRate,
              termsAndConditions: quote.termsAndConditions || prev.termsAndConditions,
              notes: quote.notes || prev.notes,
            }));
          }

        } else {
          setState((prev) => ({
            ...prev,
            invoiceNumber: `${prefix}${nextNum}`,
          }));
        }
      } catch (err) {
        console.error("Failed to load initial invoice data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadData();
  }, [fromQuoteId, preSelectedClientId, preSelectedServiceId, currentTenant]);

  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      const detection = detectStateFromGstin(found.gstin);
      setState((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientCompanyName: found.companyName || "",
        clientPan: found.pan || "",
        clientEmail: found.email || "",
        clientPhone: found.phone,
        clientAddress:
          found.address ||
          (found.billingAddress
            ? `${found.billingAddress.street}, ${found.billingAddress.city}`
            : ""),
        clientGstin: found.gstin || "",
        ...(detection ? { gstType: detection.suggestedGstType } : {}),
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
              companyName: state.clientCompanyName?.trim() || undefined,
              pan: state.clientPan?.trim() || undefined,
              phone: state.clientPhone || "+91 00000 00000",
              email: state.clientEmail || undefined,
              address: state.clientAddress || undefined,
              gstin: state.clientGstin || undefined,
            });
            if (newClient) {
              finalClientId = newClient.id;
            }
          } catch (cErr) {
            console.warn("Could not auto-create client for invoice:", cErr);
          }
        }
      }

      await InvoiceService.createInvoice({
        invoiceNumber: state.invoiceNumber,
        quotationId: state.quotationId,
        quotationNumber: state.quotationNumber,
        clientId: finalClientId || undefined,
        clientName: state.clientName,
        clientCompanyName: state.clientCompanyName || undefined,
        clientPan: state.clientPan || undefined,
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
          hsnSacCode: i.hsnSacCode,
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
        gstType: state.gstType,
        defaultTaxRate: state.defaultTaxRate,
        taxBreakdown: totals.taxBreakdown,
        totalTax: totals.totalTax,
        totalAmount: totals.totalAmount,
        paidAmount: state.paidAmount || 0,
        balanceDue: totals.balanceDue,
        isRoundOffEnabled: state.isRoundOffEnabled,
        roundOffAmount: totals.roundOffAmount,
        termsAndConditions: state.termsAndConditions,
        notes: state.notes,
      });

      bypassWarning();
      router.push("/invoices");
    } catch (err) {
      console.error("Failed to save invoice:", err);
      setIsSubmitting(false);
    }
  };

  const activeTaxRates = Array.from(
    new Set(
      state.items
        .filter((it) => (Number(it.amount) || 0) > 0)
        .map((it) => (it.taxRate !== undefined && it.taxRate !== null ? Number(it.taxRate) : state.defaultTaxRate))
    )
  ).sort((a, b) => a - b);
  const isMultiRate = activeTaxRates.length > 1;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading Quotation details...</span>
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
              <span>
                {sourceQuote
                  ? `Generate Invoice from #${sourceQuote.quotationNumber}`
                  : "Create New Tax Invoice"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Create official tax bill, set payment due date, apply advance deposits, and generate printable GST receipt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigateWithGuard("/invoices")}
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs hover:border-slate-300"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>Preview</span>
          </button>
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
        {/* Left 2 Cols: Metadata, Client, Line Items, Terms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="clay-card p-6 space-y-5">
            {/* Clean 2x2 Header Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice Number *"
                value={state.invoiceNumber}
                onChange={(e) => setState((p) => ({ ...p, invoiceNumber: e.target.value }))}
                required
              />

              {/* Multi-Currency Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Billing Currency</span>
                </label>
                <select
                  value={state.currency}
                  onChange={(e) => setState((p) => ({ ...p, currency: e.target.value as CurrencyCode }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="INR">₹ INR (India)</option>
                  <option value="USD">$ USD (Global / US)</option>
                  <option value="EUR">€ EUR (Europe)</option>
                  <option value="GBP">£ GBP (UK)</option>
                  <option value="AED">AED (Dubai / UAE)</option>
                  <option value="CAD">CA$ CAD (Canada)</option>
                  <option value="AUD">AU$ AUD (Australia)</option>
                  <option value="SGD">S$ SGD (Singapore)</option>
                </select>
              </div>

              <Input
                label="Issue Date *"
                type="date"
                value={state.issueDate}
                onChange={(e) => setState((p) => ({ ...p, issueDate: e.target.value }))}
                required
              />

              {/* Due Date with Quick Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Due Date *</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                      Presets:
                    </span>
                    {[0, 7, 15, 30, 60].map((days) => {
                      const active = isActiveDuePreset(days);
                      const label = days === 0 ? "Today" : `+${days}d`;
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => applyDueDays(days)}
                          className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs",
                            active
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input
                  type="date"
                  value={state.dueDate}
                  onChange={(e) => setState((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Client Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client Selection
                </span>
                {detectedStateInfo && (
                  <span
                    className={cn(
                      "text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs animate-in fade-in-50",
                      detectedStateInfo.isSameState
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    )}
                  >
                    📍 {detectedStateInfo.stateName} ({detectedStateInfo.code}) •{" "}
                    {detectedStateInfo.isSameState ? "CGST + SGST" : "IGST"}
                  </span>
                )}
              </div>

              <ClientSearchCombobox
                clients={clients}
                selectedClientId={state.clientId}
                onSelectClient={(client) => handleClientSelect(client.id)}
                onClear={() => {
                  setState((prev) => ({
                    ...prev,
                    clientId: "",
                    clientName: "",
                    clientCompanyName: "",
                    clientEmail: "",
                    clientPhone: "",
                    clientAddress: "",
                    clientGstin: "",
                    clientPan: "",
                  }));
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <Input
                  label="Client Name *"
                  placeholder="e.g. Rahul Sharma"
                  value={state.clientName || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientName: e.target.value }))}
                  required
                />
                <Input
                  label="Company Name (Optional)"
                  placeholder="e.g. Sharma Enterprises Pvt Ltd"
                  value={state.clientCompanyName || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientCompanyName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Phone *"
                  placeholder="+91 98765 43210"
                  value={state.clientPhone || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientPhone: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  placeholder="client@example.com"
                  value={state.clientEmail || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientEmail: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Client GSTIN (Optional)
                    </label>
                    {detectedStateInfo && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        {detectedStateInfo.stateName}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="27AAACS1429B1Z5"
                    value={state.clientGstin || ""}
                    onChange={(e) => {
                      const newGstin = e.target.value.toUpperCase();
                      const detection = detectStateFromGstin(newGstin);
                      setState((p) => ({
                        ...p,
                        clientGstin: newGstin,
                        ...(detection ? { gstType: detection.suggestedGstType } : {}),
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <Input
                  label="Client PAN (Optional)"
                  placeholder="ABCDE1234F"
                  value={state.clientPan || ""}
                  onChange={(e) => setState((p) => ({ ...p, clientPan: e.target.value }))}
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
                  currency={state.currency}
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Terms & Conditions
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                1-Click Quick Clauses
              </span>
            </div>

            {/* Quick-insert Terms Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              {STANDARD_INVOICE_TERMS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => insertTermClause(preset.text)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  ⚡ {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={insertAllStandardTerms}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-all cursor-pointer shadow-2xs"
              >
                + Insert All Standard
              </button>
            </div>

            <textarea
              rows={4}
              value={state.termsAndConditions}
              onChange={(e) => setState((p) => ({ ...p, termsAndConditions: e.target.value }))}
              placeholder="e.g. Payment due within 15 days. Please remit payment via NEFT/IMPS..."
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
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">
                      Apply GST / Tax
                    </span>
                  </label>
                  {state.isTaxEnabled && (
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {isMultiRate ? "Multi-Rate (Item-Wise)" : `${state.defaultTaxRate}% Total`}
                    </span>
                  )}
                </div>

                {state.isTaxEnabled && (
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 animate-in fade-in-50 duration-200">
                    {/* GST Rate Quick Selection */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isMultiRate ? "Item-Wise Slabs Applied" : "Tax Rate (%)"}
                      </span>
                      {isMultiRate ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {activeTaxRates.map((rate) => (
                            <span
                              key={rate}
                              className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-2xs"
                            >
                              {rate}%
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500 font-semibold">
                            (Rule 46 Itemized)
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1">
                          {[5, 12, 18, 28].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => {
                                setState((p) => ({
                                  ...p,
                                  defaultTaxRate: rate,
                                  items: p.items.map((it) => ({ ...it, taxRate: rate })),
                                }));
                              }}
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
                      )}
                    </div>

                    {/* Intra-State vs Inter-State Pill Toggle */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Tax Destination
                        </span>
                        {detectedStateInfo && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded shadow-2xs">
                            📍 {detectedStateInfo.stateName}
                          </span>
                        )}
                      </div>
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

              {/* Optional Auto Round-Off */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={state.isRoundOffEnabled}
                    onChange={(e) => setState((p) => ({ ...p, isRoundOffEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Round Off Total</span>
                </label>
                {state.isRoundOffEnabled && totals.roundOffAmount !== undefined && (
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {totals.roundOffAmount > 0
                      ? `+₹${totals.roundOffAmount.toFixed(2)}`
                      : totals.roundOffAmount < 0
                      ? `-₹${Math.abs(totals.roundOffAmount).toFixed(2)}`
                      : "₹0.00"}
                  </span>
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
                  Advance Paid Amount ({CURRENCIES[state.currency]?.symbol || "₹"})
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

      {/* Invoice Live Preview Modal via React Portal */}
      {mounted && isPreviewOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Invoice Live Preview
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Draft Tax Invoice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Content Container (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 custom-scrollbar">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-4">
                <InvoicePrintDocument
                  invoice={{
                    id: "preview",
                    tenantId: currentTenant?.id || "default",
                    invoiceNumber: state.invoiceNumber,
                    quotationId: state.quotationId,
                    quotationNumber: state.quotationNumber,
                    clientId: state.clientId,
                    clientName: state.clientName || "Client Name",
                    clientCompanyName: state.clientCompanyName,
                    clientEmail: state.clientEmail,
                    clientPhone: state.clientPhone,
                    clientAddress: state.clientAddress,
                    clientGstin: state.clientGstin,
                    clientPan: state.clientPan,
                    issueDate: state.issueDate,
                    dueDate: state.dueDate,
                    currency: state.currency,
                    items: state.items,
                    subtotal: totals.subtotal,
                    discountType: state.discountType,
                    discountValue: state.discountValue,
                    discountAmount: totals.discountAmount,
                    isTaxEnabled: state.isTaxEnabled,
                    gstType: state.gstType,
                    taxBreakdown: totals.taxBreakdown,
                    totalTax: totals.totalTax,
                    totalAmount: totals.totalAmount,
                    paidAmount: state.paidAmount || 0,
                    balanceDue: totals.balanceDue,
                    isRoundOffEnabled: state.isRoundOffEnabled,
                    roundOffAmount: totals.roundOffAmount,
                    termsAndConditions: state.termsAndConditions,
                    notes: state.notes,
                    status: totals.balanceDue <= 0 ? "paid" : (state.paidAmount || 0) > 0 ? "partially_paid" : "due",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                  tenant={currentTenant || {
                    id: "default",
                    businessName: "Your Company",
                    email: "info@example.com",
                    phone: "+91 9876543210",
                    address: "Business Address",
                    currency: "INR",
                    settings: {
                      defaultCurrency: "INR",
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                Review all line items, GST breakdown, QR code, and bank details before issuing invoice.
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={showWarningModal}
        onConfirmLeave={confirmLeave}
        onCancel={cancelLeave}
        documentType="invoice"
      />
    </form>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading Invoice Generator...</span>
        </div>
      }
    >
      <NewInvoiceContent />
    </Suspense>
  );
}
