"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { QuotationService } from "@/services/quotation.service";
import { Quotation } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotationStatusBadge } from "@/components/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getWhatsAppQuotationShareUrl } from "@/lib/whatsapp";
import { useTenant } from "@/hooks/use-tenant";

import {
  ArrowLeft,
  Share2,
  Receipt,
  Eye,
  Edit2,
  Loader2,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { downloadDocumentPdf } from "@/lib/print-page-helper";

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h2 className="text-lg font-bold text-slate-800">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">The requested quotation record does not exist in the database.</p>
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

  const cleanPhone = quote.clientPhone ? quote.clientPhone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanPhone
    ? getWhatsAppQuotationShareUrl({
        clientPhone: quote.clientPhone || "",
        clientName: quote.clientName,
        quotationNumber: quote.quotationNumber,
        quotationId: quote.id,
        publicToken: quote.publicToken,
        totalAmount: quote.totalAmount,
        advanceAmount: quote.advanceAmount,
        advancePercentage: quote.advanceValue,
        advanceType: quote.advanceType,
        validUntil: formatDate(quote.validUntil),
        currency: quote.currency,
        businessName: currentTenant?.businessName,
      })
    : "";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="clay-icon-squircle p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                #{quote.quotationNumber}
              </h1>
              <QuotationStatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued: {formatDate(quote.date)} | Valid until: {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF Button */}
          <Button
            size="sm"
            onClick={() => downloadDocumentPdf(`/quotations/${quote.id}/preview`)}
            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>

          {/* Preview PDF */}
          <Link href={`/quotations/${quote.id}/preview`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview</span>
            </Button>
          </Link>

          {/* Edit Button */}
          <Link href={`/quotations/${quote.id}/edit`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50">
              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </Button>
          </Link>

          {/* WhatsApp Share */}
          {cleanPhone && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100">
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </Button>
            </a>
          )}

          {/* Convert to Invoice or View Invoice */}
          {quote.status === "converted" ? (
            <Link href={quote.convertedToInvoiceId ? `/invoices/${quote.convertedToInvoiceId}` : `/invoices`}>
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs">
                <Receipt className="h-3.5 w-3.5" />
                <span>View Invoice</span>
              </Button>
            </Link>
          ) : (
            <Link href={`/invoices/new?quotationId=${quote.id}`}>
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs">
                <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                <span>Convert to Invoice</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="clay-card p-5">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimate Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(quote.totalAmount, quote.currency)}
          </p>
        </Card>
        <Card className="clay-card p-5">
          <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Subtotal</p>
          <p className="text-2xl font-black text-blue-800 mt-1">
            {formatCurrency(quote.subtotal, quote.currency)}
          </p>
        </Card>
        <Card className="clay-card p-5">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tax Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(quote.totalTax, quote.currency)}
          </p>
        </Card>
      </div>

      {/* Client Information & Terms Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Details */}
        <Card className="clay-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="clay-icon-squircle p-1.5 bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Client Information</h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-slate-900 text-sm">{quote.clientName}</p>
            {quote.clientCompanyName && (
              <p className="text-slate-600 font-medium">{quote.clientCompanyName}</p>
            )}
            {quote.clientPhone && (
              <p className="text-slate-600 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${quote.clientPhone}`} className="hover:text-emerald-700 font-medium">{quote.clientPhone}</a>
              </p>
            )}
            {quote.clientEmail && (
              <p className="text-slate-600 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${quote.clientEmail}`} className="hover:text-emerald-700 font-medium">{quote.clientEmail}</a>
              </p>
            )}
            {quote.clientAddress && (
              <p className="text-slate-500 flex items-start gap-2 pt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{quote.clientAddress}</span>
              </p>
            )}
            {(quote.clientGstin || quote.clientPan) && (
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
                {quote.clientGstin && <span>GSTIN: <span className="text-slate-800 font-bold">{quote.clientGstin}</span></span>}
                {quote.clientPan && <span>PAN: <span className="text-slate-800 font-bold">{quote.clientPan}</span></span>}
              </div>
            )}
          </div>
        </Card>

        {/* Validity & Terms Details */}
        <Card className="clay-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="clay-icon-squircle p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Scope & Advance Terms</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 font-medium">Valid Until</span>
              <span className="font-bold text-slate-800">{formatDate(quote.validUntil)}</span>
            </div>
            {quote.advanceType && quote.advanceType !== "none" && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
                <span className="text-slate-500 font-medium">Advance Required</span>
                <span className="font-bold text-emerald-700">
                  {quote.advanceType === "percentage"
                    ? `${quote.advanceValue || 50}% (${formatCurrency(quote.advanceAmount || 0, quote.currency)})`
                    : formatCurrency(quote.advanceAmount || 0, quote.currency)}
                </span>
              </div>
            )}
            {quote.notes && (
              <div className="pt-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Notes</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px] whitespace-pre-line">{quote.notes}</p>
              </div>
            )}
            {quote.termsAndConditions && (
              <div className="pt-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Terms & Conditions</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px] whitespace-pre-line line-clamp-3">{quote.termsAndConditions}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="clay-card p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Estimated Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(quote.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <p>{item.description}</p>
                    {item.detailedNotes && <p className="text-[11px] text-slate-400 mt-0.5">{item.detailedNotes}</p>}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{item.quantity || 1} {item.unit}</td>
                  <td className="py-3 px-3 text-right font-medium">{item.rate ? formatCurrency(item.rate, quote.currency) : "-"}</td>
                  <td className="py-3 px-3 text-right font-bold">{formatCurrency(item.amount, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
