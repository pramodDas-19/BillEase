"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { useTenant } from "@/hooks/use-tenant";
import { InvoicePrintDocument } from "@/components/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const invoice = MOCK_INVOICES.find((i) => i.id === id) || MOCK_INVOICES[0];

  if (!invoice) {
    notFound();
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden max-w-4xl mx-auto">
        <Link href={`/invoices/${invoice.id}`} className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoice</span>
        </Link>

        <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
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
