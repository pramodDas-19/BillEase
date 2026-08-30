"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { MOCK_PAYMENTS } from "@/mock/payments.mock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge, PaymentRecordModal } from "@/components/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateShareableWhatsAppUrl, generateShareableEmailUrl } from "@/lib/pdf-generator";
import {
  ArrowLeft,
  Share2,
  Mail,
  CreditCard,
  Eye,
  CheckCircle,
} from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const invoice = MOCK_INVOICES.find((i) => i.id === id) || MOCK_INVOICES[0];
  if (!invoice) {
    notFound();
  }

  const invoicePayments = MOCK_PAYMENTS.filter((p) => p.invoiceId === invoice.id);

  const whatsappText = `Hello ${invoice.clientName},\nPlease find attached Invoice #${invoice.invoiceNumber} for ${formatCurrency(
    invoice.totalAmount,
    invoice.currency
  )} with balance due of ${formatCurrency(invoice.balanceDue, invoice.currency)}.`;
  const whatsappUrl = generateShareableWhatsAppUrl(invoice.clientPhone || "", whatsappText);
  const emailUrl = generateShareableEmailUrl(
    invoice.clientEmail || "",
    `Invoice #${invoice.invoiceNumber} from Royal Events & Print`,
    whatsappText
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued: {formatDate(invoice.issueDate)} | Due: {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/invoices/${invoice.id}/preview`}>
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

          {invoice.clientEmail && (
            <a href={emailUrl}>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </Button>
            </a>
          )}

          {invoice.balanceDue > 0 && (
            <Button
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Billed To</p>
          <h3 className="font-bold text-slate-900">{invoice.clientName}</h3>
          <p className="text-xs text-slate-600">{invoice.clientPhone}</p>
          {invoice.clientGstin && (
            <p className="text-xs text-slate-700 font-medium">GSTIN: {invoice.clientGstin}</p>
          )}
        </Card>

        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</p>
          <h3 className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(invoice.totalAmount, invoice.currency)}
          </h3>
          <p className="text-xs text-emerald-600 font-medium">
            Paid: {formatCurrency(invoice.paidAmount, invoice.currency)}
          </p>
        </Card>

        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Balance Due</p>
          <h3 className="text-2xl font-extrabold text-amber-700">
            {formatCurrency(invoice.balanceDue, invoice.currency)}
          </h3>
          <p className="text-xs text-slate-500">
            Due by {formatDate(invoice.dueDate)}
          </p>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Billed Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
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
                      Qty: {item.quantity} {item.unit || ""} {item.rate && `@ ${formatCurrency(item.rate, invoice.currency)}`}
                    </p>
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.amount, invoice.currency)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Payment History</CardTitle>
          {invoice.balanceDue > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs h-8"
            >
              + Add Payment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {invoicePayments.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No payments recorded against this invoice yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {invoicePayments.map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.paymentNumber}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{formatDate(p.paymentDate)} • Ref: {p.transactionReference || "—"}</p>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(p.amount, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
      />
    </div>
  );
}
