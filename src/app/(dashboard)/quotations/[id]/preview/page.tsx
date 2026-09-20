"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QuotationService } from "@/services/quotation.service";
import { ClientService } from "@/services/client.service";
import { Quotation } from "@/types";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentTemplateRenderer,
} from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, Palette, Download } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";

export default function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant, refreshTenantData } = useTenant();
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Default to tenant preferred template or fallback to Advanced GST
  const defaultTemplateId =
    currentTenant?.settings?.defaultQuotationTemplate || "a4_modern";
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);

  useEffect(() => {
    if (currentTenant?.settings?.defaultQuotationTemplate) {
      setSelectedTemplateId(currentTenant.settings.defaultQuotationTemplate);
    }
  }, [currentTenant?.settings?.defaultQuotationTemplate]);

  useEffect(() => {
    QuotationService.getQuotationById(id).then(async (data) => {
      if (data?.clientId) {
        try {
          const client = await ClientService.getClientById(data.clientId);
          if (client) {
            data.clientCompanyName = data.clientCompanyName || client.companyName;
            data.clientAddress = data.clientAddress || client.address;
            data.clientPhone = data.clientPhone || client.phone;
            data.clientEmail = data.clientEmail || client.email;
            data.clientGstin = data.clientGstin || client.gstin;
            data.clientPan = data.clientPan || client.pan;
          }
        } catch {
          // ignore
        }
      }
      setQuote(data);
      setIsLoading(false);
    });
  }, [id]);

  const handlePrint = () => {
    if (!quote) return;
    triggerDocumentPrint(
      quote.quotationNumber,
      "Quotation",
      selectedTemplateId
    );
  };

  const handleDownloadPdf = () => {
    handlePrint();
  };

  // Direct print/download if query parameter has ?download=true or ?autoPrint=true
  useEffect(() => {
    if (quote && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("download") === "true" || sp.get("autoPrint") === "true") {
        const t = setTimeout(() => {
          handlePrint();
        }, 450);
        return () => clearTimeout(t);
      }
    }
  }, [quote, selectedTemplateId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading Quotation...</span>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Quotation not found</h2>
        <p className="text-xs text-slate-500">The requested quotation could not be located in database.</p>
        <Link
          href="/quotations"
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quotations</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Action Toolbar (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quotations</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/templates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold shadow-xs transition-colors"
          >
            <Palette className="h-3.5 w-3.5 text-[#0C9484]" />
            <span className="hidden xs:inline">Customize Template</span>
            <span className="xs:hidden">Customize</span>
          </Link>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="gap-1.5 text-xs font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-bold cursor-pointer bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* 2. Official Printable Quotation Document Container */}
      <div
        ref={documentRef}
        className="w-full flex justify-center py-2 sm:py-4 print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible"
      >
        <DocumentTemplateRenderer
          document={quote}
          type="quotation"
          tenant={currentTenant}
          templateId={selectedTemplateId}
        />
      </div>
    </div>
  );
}
