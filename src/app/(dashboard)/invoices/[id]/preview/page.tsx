"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { Invoice } from "@/types";
import { useTenant } from "@/hooks/use-tenant";
import { InvoicePrintDocument } from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InvoiceService.getInvoiceById(id).then((data) => {
      setInvoice(data);
      setIsLoading(false);
    });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading Tax Invoice...</span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden max-w-4xl mx-auto">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>

        <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold cursor-pointer">
          <Printer className="h-3.5 w-3.5" />
          <span>Print / Save as PDF</span>
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md print:p-0 print:border-none print:shadow-none">
        <InvoicePrintDocument invoice={invoice} tenant={currentTenant} />
      </div>
    </div>
  );
}
