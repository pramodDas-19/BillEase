"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { ClientService } from "@/services/client.service";
import { Invoice } from "@/types";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentTemplateRenderer,
  DocumentFormatBar,
} from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, Palette, Download } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";
import { downloadElementAsPdf } from "@/lib/pdf-download-helper";
import { cn } from "@/lib/utils";

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant, refreshTenantData } = useTenant();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Default to tenant preferred template or fallback to Advanced GST
  const defaultTemplateId =
    currentTenant?.settings?.defaultInvoiceTemplate || "a4_modern";
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);

  useEffect(() => {
    if (currentTenant?.settings?.defaultInvoiceTemplate) {
      setSelectedTemplateId(currentTenant.settings.defaultInvoiceTemplate);
    }
  }, [currentTenant?.settings?.defaultInvoiceTemplate]);

  useEffect(() => {
    InvoiceService.getInvoiceById(id).then(async (data) => {
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
      setInvoice(data);
      setIsLoading(false);
    });
  }, [id]);

  const handlePrint = () => {
    if (!invoice) return;
    triggerDocumentPrint(
      invoice.invoiceNumber,
      "Invoice",
      selectedTemplateId
    );
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    if (!documentRef.current) {
      handlePrint();
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      const isLandscape = selectedTemplateId.includes("landscape");
      const isA5 = selectedTemplateId.startsWith("a5");
      const isThermal = selectedTemplateId.startsWith("thermal");
      const success = await downloadElementAsPdf(documentRef.current, fileName, {
        format: isThermal ? "thermal" : isA5 ? "a5" : "a4",
        orientation: isLandscape ? "landscape" : "portrait",
      });
      if (!success) {
        handlePrint();
      }
    } catch (err) {
      console.warn("PDF generation fallback to print:", err);
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct print/download if query parameter has ?download=true or ?autoPrint=true
  useEffect(() => {
    if (invoice && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("download") === "true" || sp.get("autoPrint") === "true") {
        const t = setTimeout(() => {
          handlePrint();
        }, 450);
        return () => clearTimeout(t);
      }
    }
  }, [invoice, selectedTemplateId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading Invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Invoice not found</h2>
        <p className="text-xs text-slate-500">The requested invoice could not be located in database.</p>
        <Link
          href="/invoices"
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24 sm:pb-12">
      {/* 1. Navigation & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 min-h-[40px] px-2 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Change Format Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFormatSelector((prev) => !prev)}
            className={cn(
              "gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-bold cursor-pointer rounded-xl shadow-xs transition-all",
              showFormatSelector
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Palette className="h-3.5 w-3.5 text-indigo-600" />
            <span>{showFormatSelector ? "Close Formats" : "Change Format"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="gap-1.5 min-h-[40px] px-4 py-2 text-xs font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
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
            className="gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-bold cursor-pointer bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Format Selector Dropdown/Bar (Real-time template switching) */}
      {showFormatSelector && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <DocumentFormatBar
            currentTemplateId={selectedTemplateId}
            onSelectTemplate={(tmplId) => setSelectedTemplateId(tmplId)}
            documentType="invoice"
            tenantId={currentTenant?.id}
            defaultTemplateId={currentTenant?.settings?.defaultInvoiceTemplate || "a4_modern"}
            onSavedAsDefault={refreshTenantData}
            hideCardsOnMobile={false}
          />
        </div>
      )}

      {/* Sticky Mobile Quick Action Bar (Bottom of Phone Screen) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-2xl print:hidden">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFormatSelector((prev) => !prev)}
          className={cn(
            "min-h-[42px] px-3 gap-1.5 text-xs font-bold cursor-pointer rounded-xl shadow-xs",
            showFormatSelector ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-300 text-slate-800"
          )}
        >
          <Palette className="h-3.5 w-3.5 text-indigo-600" />
          <span className="hidden xs:inline">Formats</span>
        </Button>

        <Button
          size="sm"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex-1 min-h-[42px] gap-1.5 text-xs font-black cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving PDF...</span>
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
          className="min-h-[42px] px-4 gap-1.5 text-xs font-bold cursor-pointer bg-white border-slate-300 text-slate-800 rounded-xl shadow-xs"
        >
          <Printer className="h-3.5 w-3.5 text-slate-600" />
          <span>Print</span>
        </Button>
      </div>

      {/* 2. Live Preview & Official Document Print Container */}
      <div
        ref={documentRef}
        className="w-full flex justify-center py-2 sm:py-4 print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible"
      >
        <DocumentTemplateRenderer
          document={invoice}
          type="invoice"
          tenant={currentTenant}
          templateId={selectedTemplateId}
        />
      </div>
    </div>
  );
}
