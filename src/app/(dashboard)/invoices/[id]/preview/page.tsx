"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { ClientService } from "@/services/client.service";
import { Invoice } from "@/types";
import { useTenant } from "@/hooks/use-tenant";
import {
  DocumentTemplateRenderer,
} from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, Palette } from "lucide-react";
import { triggerDocumentPrint } from "@/lib/print-page-helper";

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant, refreshTenantData } = useTenant();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Navigation & Quick Actions Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/templates"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold shadow-xs transition-colors"
          >
            <Palette className="h-3.5 w-3.5 text-[#0C9484]" />
            <span>Customize Template</span>
          </Link>

          <Button
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-bold cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* 2. Live Preview & Official Document Print Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-4 shadow-md print:p-0 print:m-0 print:border-none print:shadow-none print:overflow-visible print:rounded-none">
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
