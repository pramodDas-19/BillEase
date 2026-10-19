"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentFormatBar,
  DocumentTemplateRenderer,
} from "@/components/documents";
import { Invoice, Quotation } from "@/types";
import { ArrowLeft, Check, Sparkles, Layout, Printer, ChevronLeft, ChevronRight, FileText, FileCheck } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";
import { Button } from "@/components/ui/button";
import { getTemplateById, getTemplatesByCategory } from "@/config/document-templates";
import { TenantService } from "@/services/tenant.service";
import { cn } from "@/lib/utils";

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

// High-fidelity sample quotation with advance split & validity date
const SAMPLE_PREVIEW_QUOTATION: Quotation = {
  id: "sample-quot-preview",
  tenantId: "sample-tenant",
  quotationNumber: "QT-2026-0089",
  clientId: "sample-client-2",
  clientName: "Rahul & Sneha Kapoor",
  clientCompanyName: "Kapoor Events & Hospitality",
  clientAddress: "Plot 18, Commercial Belt, Malviya Nagar, Jaipur, Rajasthan - 302017",
  clientPhone: "+91 98290 11223",
  clientEmail: "rahul.kapoor@example.com",
  clientGstin: "08AABCK9988D1Z4",
  clientPan: "AABCK9988D",
  date: new Date().toISOString().split("T")[0],
  validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  status: "sent",
  currency: "INR",
  isTaxEnabled: true,
  subtotal: 45000,
  discountAmount: 2500,
  totalTax: 7650,
  totalAmount: 50150,
  advanceAmount: 20000,
  advanceType: "percentage",
  advanceValue: 40,
  notes: "Proposal valid for 15 days from issue date. 40% advance required upon confirmation.",
  termsAndConditions:
    "1. Quotation includes sound engineering, staging & acoustic setup.\n2. Balance 60% payable upon event setup completion.\n3. Taxes applicable as per GST regulations.",
  items: [
    {
      id: "it-q1",
      description: "Line Array Sound System & Digital Stage Mixing",
      detailedNotes: "Full dual-array line rig, 32-channel digital console & sound engineer",
      hsnSacCode: "9983",
      quantity: 1,
      unit: "Event",
      rate: 30000,
      amount: 30000,
      taxRate: 18,
    },
    {
      id: "it-q2",
      description: "Atmospheric Moving Head LED Lighting Truss",
      detailedNotes: "8x DMX beam moving heads, haze machine, automated lighting controller",
      hsnSacCode: "9983",
      quantity: 1,
      unit: "Set",
      rate: 15000,
      amount: 15000,
      taxRate: 18,
    },
  ],
  taxBreakdown: [
    {
      name: "GST 18%",
      rate: 18,
      amount: 7650,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function SettingsTemplatesPage() {
  const { currentTenant, updateTenantSettings, refreshTenantData } = useTenant();
  const [activeDocType, setActiveDocType] = useState<"invoice" | "quotation">("invoice");
  const [applyToBoth, setApplyToBoth] = useState<boolean>(true);

  const defaultInvoiceTemplateId =
    currentTenant?.settings?.defaultInvoiceTemplate || "a4_modern";
  const defaultQuotationTemplateId =
    currentTenant?.settings?.defaultQuotationTemplate || defaultInvoiceTemplateId;

  const currentDefaultTemplateId =
    activeDocType === "invoice" ? defaultInvoiceTemplateId : defaultQuotationTemplateId;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentDefaultTemplateId);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync selectedTemplateId whenever activeDocType or tenant settings update
  useEffect(() => {
    const targetDefault =
      activeDocType === "invoice"
        ? currentTenant?.settings?.defaultInvoiceTemplate || "a4_modern"
        : currentTenant?.settings?.defaultQuotationTemplate || currentTenant?.settings?.defaultInvoiceTemplate || "a4_modern";
    setSelectedTemplateId(targetDefault);
  }, [activeDocType, currentTenant?.settings?.defaultInvoiceTemplate, currentTenant?.settings?.defaultQuotationTemplate]);

  const currentMeta = getTemplateById(selectedTemplateId);
  const categoryTemplates = getTemplatesByCategory(currentMeta.category);
  const currentIndex = Math.max(
    0,
    categoryTemplates.findIndex((t) => t.id === selectedTemplateId)
  );

  const handlePrevTemplate = () => {
    const prevIndex =
      (currentIndex - 1 + categoryTemplates.length) % categoryTemplates.length;
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
      const payload: Record<string, any> = {
        defaultDocumentSize: currentMeta.category,
      };

      if (activeDocType === "invoice") {
        payload.defaultInvoiceTemplate = selectedTemplateId;
        if (applyToBoth) {
          payload.defaultQuotationTemplate = selectedTemplateId;
        }
      } else {
        payload.defaultQuotationTemplate = selectedTemplateId;
        if (applyToBoth) {
          payload.defaultInvoiceTemplate = selectedTemplateId;
        }
      }

      await updateTenantSettings(payload);
      await TenantService.updateSettings(currentTenant.id, payload);
      setSavedSuccess(true);
      if (refreshTenantData) {
        await refreshTenantData();
      }
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save default template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSample = () => {
    if (activeDocType === "invoice") {
      triggerDocumentPrint(
        SAMPLE_PREVIEW_INVOICE.invoiceNumber,
        "Invoice",
        selectedTemplateId
      );
    } else {
      triggerDocumentPrint(
        SAMPLE_PREVIEW_QUOTATION.quotationNumber,
        "Quotation",
        selectedTemplateId
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Header Navigation & Document Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 print:hidden">
        <div>
          {/* Desktop Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 mb-1">
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

          {/* Title row with mobile back arrow */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/settings"
              aria-label="Back to Settings"
              className="sm:hidden -ml-1.5 p-1.5 rounded-full text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layout className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 hidden sm:inline" />
              <span>Document Formats &amp; Templates</span>
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 hidden sm:block">
            Browse and test all 15 Indian-style templates. Choose default layouts for Tax Invoices and Quotations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Document Type Switcher: Invoices vs Quotations */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveDocType("invoice")}
              className={cn(
                "px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeDocType === "invoice"
                  ? "bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Invoices</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDocType("quotation")}
              className={cn(
                "px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeDocType === "quotation"
                  ? "bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Quotations</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={handlePrintSample}
            className="hidden sm:inline-flex gap-1.5 text-xs font-bold min-h-[38px] cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Test Print</span>
          </Button>
        </div>
      </div>

      {/* 2. Interactive Template Switcher Toolbar */}
      <DocumentFormatBar
        currentTemplateId={selectedTemplateId}
        onSelectTemplate={(id) => setSelectedTemplateId(id)}
        documentType={activeDocType}
        tenantId={currentTenant?.id}
        defaultTemplateId={currentDefaultTemplateId}
        onSavedAsDefault={refreshTenantData}
        onSaveDefault={async (tmplId, cat) => {
          const payload: Record<string, any> = {
            defaultDocumentSize: cat,
          };
          if (activeDocType === "invoice") {
            payload.defaultInvoiceTemplate = tmplId;
            if (applyToBoth) payload.defaultQuotationTemplate = tmplId;
          } else {
            payload.defaultQuotationTemplate = tmplId;
            if (applyToBoth) payload.defaultInvoiceTemplate = tmplId;
          }
          await updateTenantSettings(payload);
          if (currentTenant?.id) {
            await TenantService.updateSettings(currentTenant.id, payload);
          }
          if (refreshTenantData) await refreshTenantData();
        }}
        hideCardsOnMobile={true}
      />

      {/* 3. Live Preview Container with Navigation Arrows */}
      <div className="space-y-4">
        <div className="relative w-full flex items-center justify-center bg-[#f5f6fa] rounded-2xl sm:rounded-3xl p-2 sm:p-6 border border-slate-200/80 shadow-inner">
          {/* Prev Arrow Button */}
          <button
            type="button"
            onClick={handlePrevTemplate}
            aria-label="Previous template"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 min-h-[40px] min-w-[40px] flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200 active:scale-90 hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          </button>

          {/* Centered Scaled Document Sheet */}
          <div className="w-full flex justify-center py-1 print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible">
            <DocumentTemplateRenderer
              document={activeDocType === "invoice" ? SAMPLE_PREVIEW_INVOICE : SAMPLE_PREVIEW_QUOTATION}
              type={activeDocType}
              tenant={currentTenant}
              templateId={selectedTemplateId}
            />
          </div>

          {/* Next Arrow Button */}
          <button
            type="button"
            onClick={handleNextTemplate}
            aria-label="Next template"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 min-h-[40px] min-w-[40px] flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200 active:scale-90 hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Format Info & "Select this format" Action Button */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-8 print:hidden max-w-md mx-auto">
          <div className="text-center">
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              {currentMeta.name}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {currentIndex + 1} / {categoryTemplates.length} • {currentMeta.category.toUpperCase()} ({currentMeta.orientation}) • Previewing {activeDocType === "invoice" ? "Invoice" : "Quotation"}
            </p>
          </div>

          {/* Apply to both checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none py-1">
            <input
              type="checkbox"
              checked={applyToBoth}
              onChange={(e) => setApplyToBoth(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Apply this format to both Invoices &amp; Quotations</span>
          </label>

          <Button
            size="lg"
            onClick={handleSetDefault}
            disabled={isSaving || selectedTemplateId === currentDefaultTemplateId}
            className={`w-full py-4 min-h-[46px] rounded-2xl text-sm font-black shadow-md cursor-pointer transition-all ${
              savedSuccess
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : selectedTemplateId === currentDefaultTemplateId
                ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-indigo-200"
            }`}
          >
            {savedSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3]" /> Format Selected as Default
              </span>
            ) : selectedTemplateId === currentDefaultTemplateId ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" /> Current Default for {activeDocType === "invoice" ? "Invoices" : "Quotations"}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" /> Set as Default {activeDocType === "invoice" ? "Invoice" : "Quotation"} Format
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
