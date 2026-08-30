import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotationStatusBadge } from "@/components/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateShareableWhatsAppUrl, generateShareableEmailUrl } from "@/lib/pdf-generator";
import {
  ArrowLeft,
  Printer,
  Share2,
  Mail,
  Receipt,
  Edit,
  Eye,
  CheckCircle,
} from "lucide-react";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = MOCK_QUOTATIONS.find((q) => q.id === id) || MOCK_QUOTATIONS[0];

  if (!quote) {
    notFound();
  }

  const whatsappText = `Hello ${quote.clientName},\nPlease find attached your quotation #${quote.quotationNumber} for ${formatCurrency(quote.totalAmount, quote.currency)}.`;
  const whatsappUrl = generateShareableWhatsAppUrl(quote.clientPhone || "", whatsappText);
  const emailUrl = generateShareableEmailUrl(
    quote.clientEmail || "",
    `Quotation #${quote.quotationNumber} from Royal Events & Print`,
    whatsappText
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {quote.quotationNumber}
              </h1>
              <QuotationStatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {formatDate(quote.date)} | Valid until {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/quotations/${quote.id}/preview`}>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Eye className="h-3.5 w-3.5" />
              <span>Full Preview / Print</span>
            </Button>
          </Link>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1 text-xs text-emerald-700">
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </Button>
          </a>

          {quote.clientEmail && (
            <a href={emailUrl}>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </Button>
            </a>
          )}

          {quote.status !== "converted" && (
            <Link href={`/invoices/new?fromQuote=${quote.id}`}>
              <Button size="sm" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                <Receipt className="h-3.5 w-3.5" />
                <span>Convert to Invoice</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client</p>
          <h3 className="font-bold text-slate-900">{quote.clientName}</h3>
          <p className="text-xs text-slate-600">{quote.clientPhone}</p>
          {quote.clientEmail && <p className="text-xs text-slate-600">{quote.clientEmail}</p>}
          {quote.clientGstin && (
            <p className="text-xs text-slate-700 font-medium">GSTIN: {quote.clientGstin}</p>
          )}
        </Card>

        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Quotation Value
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(quote.totalAmount, quote.currency)}
          </h3>
          <p className="text-xs text-slate-500">
            {quote.isTaxEnabled ? "Inclusive of GST" : "Exclusive of GST"}
          </p>
        </Card>

        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conversion Status
          </p>
          {quote.convertedToInvoiceId ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <CheckCircle className="h-4 w-4" />
                <span>Converted to Invoice</span>
              </div>
              <Link
                href={`/invoices/${quote.convertedToInvoiceId}`}
                className="text-xs text-slate-700 underline font-medium"
              >
                View Linked Invoice
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Not yet converted. Click &quot;Convert to Invoice&quot; once client accepts.
            </p>
          )}
        </Card>
      </div>

      {/* Scope Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Scope of Work & Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {quote.items.map((item, idx) => (
              <div key={item.id} className="py-3 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-sm">
                    {idx + 1}. {item.description}
                  </p>
                  {item.detailedNotes && (
                    <p className="text-xs text-slate-500 whitespace-pre-line">{item.detailedNotes}</p>
                  )}
                  {item.quantity !== undefined && (
                    <p className="text-xs text-slate-400">
                      Qty: {item.quantity} {item.unit || ""} {item.rate && `@ ${formatCurrency(item.rate, quote.currency)}`}
                    </p>
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.amount, quote.currency)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
