"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { useTenant } from "@/hooks/use-tenant";
import { QuotationPrintDocument } from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const quote = MOCK_QUOTATIONS.find((q) => q.id === id) || MOCK_QUOTATIONS[0];

  if (!quote) {
    notFound();
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (hidden during print) */}
      <div className="flex items-center justify-between print:hidden max-w-4xl mx-auto">
        <Link href={`/quotations/${quote.id}`} className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quotation</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Official Printable Quotation Document */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md print:p-0 print:border-none print:shadow-none">
        <QuotationPrintDocument quotation={quote} tenant={currentTenant} />
      </div>
    </div>
  );
}
