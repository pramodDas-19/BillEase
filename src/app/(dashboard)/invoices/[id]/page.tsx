"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Payment } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge, PaymentRecordModal } from "@/components/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getWhatsAppInvoiceShareUrl } from "@/lib/whatsapp";
import {
  ArrowLeft,
  Share2,
  CreditCard,
  Eye,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [inv, allPayments] = await Promise.all([
          InvoiceService.getInvoiceById(id),
          PaymentService.getPayments(),
        ]);
        setInvoice(inv);
        setInvoicePayments((allPayments || []).filter((p) => p.invoiceId === id));
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading Invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
        <p className="text-xs text-slate-500">The requested invoice record does not exist in the database.</p>
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

  const whatsappUrl = getWhatsAppInvoiceShareUrl({
    clientPhone: invoice.clientPhone || "",
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
    totalAmount: invoice.totalAmount,
    balanceDue: invoice.balanceDue,
    currency: invoice.currency,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="clay-icon-squircle p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                #{invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued: {formatDate(invoice.issueDate)} | Due: {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/invoices/${invoice.id}/preview`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>Preview / PDF</span>
            </Button>
          </Link>

          {invoice.clientPhone && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100">
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </Button>
            </a>
          )}

          {invoice.balanceDue > 0 && (
            <Button
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="clay-card p-5">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(invoice.totalAmount, invoice.currency)}
          </p>
        </Card>
        <Card className="clay-card p-5">
          <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Amount Paid</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(invoice.paidAmount, invoice.currency)}
          </p>
        </Card>
        <Card className="clay-card p-5">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Balance Due</p>
          <p className="text-2xl font-black text-amber-800 mt-1">
            {formatCurrency(invoice.balanceDue, invoice.currency)}
          </p>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="clay-card p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Line Items</h3>
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
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <p>{item.description}</p>
                    {item.detailedNotes && <p className="text-[11px] text-slate-400 mt-0.5">{item.detailedNotes}</p>}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{item.quantity || 1} {item.unit}</td>
                  <td className="py-3 px-3 text-right font-medium">{item.rate ? formatCurrency(item.rate, invoice.currency) : "-"}</td>
                  <td className="py-3 px-3 text-right font-bold">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentRecordModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
