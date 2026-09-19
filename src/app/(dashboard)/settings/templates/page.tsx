"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentFormatBar,
  DocumentTemplateRenderer,
} from "@/components/documents";
import { Invoice } from "@/types";
import { ArrowLeft, Check, Sparkles, Layout, Printer } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";
import { Button } from "@/components/ui/button";

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
            <span>Invoice &amp; Quotation Templates</span>
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

      {/* 3. Live Preview Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 print:hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Live Template Preview
          </span>
          <span className="text-[11px] text-slate-500">
            Rendered with your business profile &amp; UPI details
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-6 shadow-md print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible print:rounded-none">
          <DocumentTemplateRenderer
            document={SAMPLE_PREVIEW_INVOICE}
            type="invoice"
            tenant={currentTenant}
            templateId={selectedTemplateId}
          />
        </div>
      </div>
    </div>
  );
}
