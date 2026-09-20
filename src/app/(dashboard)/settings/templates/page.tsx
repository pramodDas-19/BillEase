"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentFormatBar,
  DocumentTemplateRenderer,
} from "@/components/documents";
import { Invoice } from "@/types";
import { ArrowLeft, Check, Sparkles, Layout, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";
import { Button } from "@/components/ui/button";
import { getTemplateById, getTemplatesByCategory } from "@/config/document-templates";
import { TenantService } from "@/services/tenant.service";

// High-fidelity sample invoice for live preview in Settings
const SAMPLE_PREVIEW_INVOICE: Invoice = {
  id: "sample-inv-preview",
  tenantId: "sample-tenant",
  invoiceNumber: "INV-2026-0042",
  clientId: "sample-client",
  clientName: "Mohit Sharma",
  clientCompanyName: "Sharma Traders & Electronics",
  clientAddress: "521, Shastri Nagar, Dadabari, Kota, Rajasthan - 324009",
  clientPhone: "+91 94884 69988",
  clientEmail: "mohit.sharma@example.com",
  clientGstin: "08AABCS1429B1Z1",
  clientPan: "AABCS1429B",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  status: "sent",
  currency: "INR",
  isTaxEnabled: true,
  gstType: "intra_state",
  subtotal: 18000,
  discountAmount: 1000,
  totalTax: 3060,
  totalAmount: 20060,
  paidAmount: 5000,
  balanceDue: 15060,
  notes: "Thank you for doing business with us! Goods once delivered cannot be returned.",
  termsAndConditions:
    "1. Payment is due within 15 days of invoice date.\n2. Please mention invoice number in UPI / NEFT bank transfer references.\n3. Delayed payments incur interest @ 1.5% per month.",
  items: [
    {
      id: "it-1",
      description: "Commercial Studio Photography & Brochure Design",
      detailedNotes: "Full day on-site catalog shoot, editing & 300 GSM print layout",
      hsnSacCode: "9983",
      quantity: 1,
      unit: "Job",
      rate: 12000,
      amount: 12000,
      taxRate: 18,
    },
    {
      id: "it-2",
      description: "High-Gloss Vinyl Banners (6x4 ft)",
      detailedNotes: "Waterproof exterior eyelets, reinforced hems",
      hsnSacCode: "4911",
      quantity: 4,
      unit: "Pcs",
      rate: 1500,
      amount: 6000,
      taxRate: 18,
    },
  ],
  taxBreakdown: [
    {
      name: "GST 18%",
      rate: 18,
      amount: 3060,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function SettingsTemplatesPage() {
  const { currentTenant, refreshTenantData } = useTenant();
  const defaultTemplateId =
    currentTenant?.settings?.defaultInvoiceTemplate || "a4_advanced_gst";
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>(defaultTemplateId);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentMeta = getTemplateById(selectedTemplateId);
  const categoryTemplates = getTemplatesByCategory(currentMeta.category);
  const currentIndex = categoryTemplates.findIndex((t) => t.id === selectedTemplateId);

  const handlePrevTemplate = () => {
    const prevIndex = (currentIndex - 1 + categoryTemplates.length) % categoryTemplates.length;
    setSelectedTemplateId(categoryTemplates[prevIndex].id);
  };

  const handleNextTemplate = () => {
    const nextIndex = (currentIndex + 1) % categoryTemplates.length;
    setSelectedTemplateId(categoryTemplates[nextIndex].id);
  };

  const handleSetDefault = async () => {
    if (!currentTenant?.id) return;
    setIsSaving(true);
    try {
      await TenantService.updateSettings(currentTenant.id, {
        defaultInvoiceTemplate: selectedTemplateId,
        defaultDocumentSize: currentMeta.category,
      });
      setSavedSuccess(true);
      if (refreshTenantData) refreshTenantData();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save default template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSample = () => {
    triggerDocumentPrint(
      SAMPLE_PREVIEW_INVOICE.invoiceNumber,
      "Invoice",
      selectedTemplateId
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-indigo-600">Templates</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layout className="h-6 w-6 text-indigo-600" />
            <span>Select your Invoice Format</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Browse and test all 15 Indian-style templates. Choose your default format for A4, A5, or Thermal POS rolls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handlePrintSample}
            className="gap-1.5 text-xs font-bold cursor-pointer bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Test Print Format</span>
          </Button>
        </div>
      </div>

      {/* 2. Interactive Template Switcher Toolbar */}
      <DocumentFormatBar
        currentTemplateId={selectedTemplateId}
        onSelectTemplate={(id) => setSelectedTemplateId(id)}
        documentType="invoice"
        tenantId={currentTenant?.id}
        defaultTemplateId={currentTenant?.settings?.defaultInvoiceTemplate}
        onSavedAsDefault={refreshTenantData}
      />

      {/* 3. Live Preview Container with Mobile Navigation (Matches Image 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 print:hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Live Template Preview
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Rendered with your business profile &amp; UPI details
          </span>
        </div>

        <div className="relative w-full flex items-center justify-center">
          {/* Mobile Prev Arrow Button (Left edge of preview) */}
          <button
            type="button"
            onClick={handlePrevTemplate}
            aria-label="Previous template"
            className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/95 text-slate-700 shadow-lg border border-slate-200 active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Centered Scaled Document Sheet */}
          <div className="w-full flex justify-center py-1 print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible">
            <DocumentTemplateRenderer
              document={SAMPLE_PREVIEW_INVOICE}
              type="invoice"
              tenant={currentTenant}
              templateId={selectedTemplateId}
            />
          </div>

          {/* Mobile Next Arrow Button (Right edge of preview) */}
          <button
            type="button"
            onClick={handleNextTemplate}
            aria-label="Next template"
            className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/95 text-slate-700 shadow-lg border border-slate-200 active:scale-90 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Info & "Select this format" Button (Matches Image 5) */}
        <div className="sm:hidden flex flex-col items-center gap-3 pt-3 pb-8 print:hidden">
          <div className="text-center">
            <h4 className="font-extrabold text-slate-900 text-base">{currentMeta.name}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentIndex + 1} / {categoryTemplates.length} • {currentMeta.category.toUpperCase()} ({currentMeta.orientation})
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleSetDefault}
            disabled={isSaving || selectedTemplateId === defaultTemplateId}
            className={`w-full py-3.5 rounded-2xl text-sm font-black shadow-md cursor-pointer transition-all ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : selectedTemplateId === defaultTemplateId
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98"
            }`}
          >
            {savedSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Format Selected as Default
              </span>
            ) : selectedTemplateId === defaultTemplateId ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> Current Default Format
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" /> Select this format
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
