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

import {
  ArrowLeft,
  Share2,
  Receipt,
  Eye,
  Edit2,
  Loader2,
} from "lucide-react";


export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
        totalAmount: quote.totalAmount,
        validUntil: formatDate(quote.validUntil),
        currency: quote.currency,
      })
    : "";


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <Link href={`/quotations/${quote.id}/edit`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold text-slate-700 bg-white">
              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </Button>
          </Link>

          <Link href={`/quotations/${quote.id}/preview`}>

            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>Preview / PDF</span>
            </Button>
          </Link>

          {cleanPhone && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100">
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </Button>
            </a>
          )}

          <Link href={`/invoices/new?quotationId=${quote.id}`}>
            <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              <Receipt className="h-3.5 w-3.5" />
              <span>Convert to Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
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
