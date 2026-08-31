"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { QuotationService } from "@/services/quotation.service";
import { Quotation } from "@/types";
import { useTenant } from "@/hooks/use-tenant";
import { QuotationPrintDocument } from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

export default function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    QuotationService.getQuotationById(id).then((data) => {
      setQuote(data);
      setIsLoading(false);
    });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

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
    <div className="space-y-6">
      {/* Action Toolbar (hidden during print) */}
      <div className="flex items-center justify-between print:hidden max-w-4xl mx-auto">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quotations</span>
        </Link>

        <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold cursor-pointer">
          <Printer className="h-3.5 w-3.5" />
          <span>Print / Save as PDF</span>
        </Button>
      </div>

      {/* Official Printable Quotation Document */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md print:p-0 print:border-none print:shadow-none">
        <QuotationPrintDocument quotation={quote} tenant={currentTenant} />
      </div>
    </div>
  );
}
