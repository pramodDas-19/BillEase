"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { InvoiceService } from "@/services/invoice.service";
import { PaymentService } from "@/services/payment.service";
import { Invoice, Payment } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge, PaymentRecordModal } from "@/components/invoices";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getWhatsAppInvoiceShareUrl } from "@/lib/whatsapp";
import { useTenant } from "@/hooks/use-tenant";
import {
  ArrowLeft,
  Share2,
  CreditCard,
  Eye,
  Edit2,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
} from "lucide-react";
import { downloadDocumentPdf } from "@/lib/print-page-helper";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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

  const cleanPhone = invoice.clientPhone ? invoice.clientPhone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanPhone
    ? getWhatsAppInvoiceShareUrl({
        clientPhone: invoice.clientPhone || "",
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
        publicToken: invoice.publicToken,
        totalAmount: invoice.totalAmount,
        balanceDue: invoice.balanceDue,
        currency: invoice.currency,
        businessName: currentTenant?.businessName,
      })
    : "";

  const isOverdue = invoice.status === "overdue" || (invoice.balanceDue > 0 && new Date(invoice.dueDate).getTime() < Date.now());
  const isPaid = (invoice.balanceDue ?? 0) <= 0 || invoice.status === "paid";

  const getMethodBadge = (method?: string) => {
    const m = (method || "other").toLowerCase();
    if (m === "upi") return { label: "UPI", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (m === "bank_transfer" || m === "neft" || m === "rtgs") return { label: "Bank Transfer / NEFT", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    if (m === "cash") return { label: "Cash", bg: "bg-amber-50 text-amber-800 border-amber-200" };
    if (m === "cheque") return { label: "Cheque", bg: "bg-purple-50 text-purple-700 border-purple-200" };
    return { label: method || "Payment", bg: "bg-slate-50 text-slate-700 border-slate-200" };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in-50 duration-200">
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
          {/* Download PDF Button */}
          <Button
            size="sm"
            onClick={() => downloadDocumentPdf(`/invoices/${invoice.id}/preview`)}
            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>

          <Link href={`/invoices/${invoice.id}/preview`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview</span>
            </Button>
          </Link>

          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50">
              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
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
              className="gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
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
        <Card className={cn("clay-card p-5 relative overflow-hidden transition-all", isPaid ? "bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border-emerald-200" : "")}>
          <div className="flex items-center justify-between">
            <p className={cn("text-xs font-bold uppercase tracking-wider", isPaid ? "text-emerald-700" : "text-amber-700")}>
              {isPaid ? "Settlement Status" : "Balance Due"}
            </p>
            {isPaid && (
              <span className="clay-tag text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                Settled in Full
              </span>
            )}
          </div>
          <p className={cn("text-2xl font-black mt-1", isPaid ? "text-emerald-800" : "text-amber-800")}>
            {formatCurrency(invoice.balanceDue, invoice.currency)}
          </p>
          {isPaid && (
            <div className="absolute right-1 -bottom-2 pointer-events-none select-none opacity-85">
              <img
                src="/assets/logo/paid-stamp.png"
                alt="Paid in Full Stamp"
                className="h-16 w-auto object-contain drop-shadow-xs"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Client Information & Invoice Schedule Cards */}
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
            <p className="font-bold text-slate-900 text-sm">{invoice.clientName}</p>
            {invoice.clientCompanyName && (
              <p className="text-slate-600 font-medium">{invoice.clientCompanyName}</p>
            )}
            {invoice.clientPhone && (
              <p className="text-slate-600 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${invoice.clientPhone}`} className="hover:text-emerald-700 font-medium">{invoice.clientPhone}</a>
              </p>
            )}
            {invoice.clientEmail && (
              <p className="text-slate-600 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${invoice.clientEmail}`} className="hover:text-emerald-700 font-medium">{invoice.clientEmail}</a>
              </p>
            )}
            {invoice.clientAddress && (
              <p className="text-slate-500 flex items-start gap-2 pt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{invoice.clientAddress}</span>
              </p>
            )}
            {(invoice.clientGstin || invoice.clientPan) && (
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
                {invoice.clientGstin && <span>GSTIN: <span className="text-slate-800 font-bold">{invoice.clientGstin}</span></span>}
                {invoice.clientPan && <span>PAN: <span className="text-slate-800 font-bold">{invoice.clientPan}</span></span>}
              </div>
            )}
          </div>
        </Card>

        {/* Invoice Schedule & Linked Quotation */}
        <Card className="clay-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="clay-icon-squircle p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Billing Schedule</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 font-medium">Issue Date</span>
              <span className="font-bold text-slate-800">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 font-medium">Payment Due Date</span>
              <span className={cn("font-bold flex items-center gap-1", isOverdue ? "text-rose-600" : "text-slate-800")}>
                {isOverdue && <AlertTriangle className="h-3 w-3 text-rose-500" />}
                {formatDate(invoice.dueDate)} {isOverdue && "(Overdue)"}
              </span>
            </div>
            {invoice.quotationNumber && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
                <span className="text-slate-500 font-medium">Origin Quotation</span>
                <Link
                  href={invoice.quotationId ? `/quotations/${invoice.quotationId}` : `/quotations`}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  <span>#{invoice.quotationNumber}</span>
                </Link>
              </div>
            )}
            {invoice.notes && (
              <div className="pt-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Notes</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px] whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.termsAndConditions && (
              <div className="pt-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Terms & Conditions</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[11px] whitespace-pre-line line-clamp-3">{invoice.termsAndConditions}</p>
              </div>
            )}
          </div>
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

      {/* Payment Receipts & Settlement History Table */}
      <Card className="clay-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="clay-icon-squircle p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Recorded Payment Receipts ({invoicePayments.length})
            </h3>
          </div>

          {invoice.balanceDue > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="clay-tag inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer transition-colors"
            >
              <CreditCard className="h-3 w-3 text-emerald-600" />
              <span>Record Another Payment</span>
            </button>
          )}
        </div>

        {invoicePayments.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <Clock className="h-6 w-6 mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs font-medium">No payments recorded for this invoice yet.</p>
            {invoice.balanceDue > 0 && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                <span>Click here to record a payment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference / UTR</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicePayments.map((pay) => {
                  const badge = getMethodBadge(pay.paymentMethod);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        #{pay.paymentNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn("clay-tag px-2 py-0.5 text-[10px] font-bold border", badge.bg)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {pay.transactionReference || "-"}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                        {pay.notes || "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                        {formatCurrency(pay.amount, pay.currency || invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-bold text-xs">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-slate-700 text-right uppercase tracking-wider text-[10px]">
                    Total Payments Received:
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                    {formatCurrency(
                      invoicePayments.reduce((acc, p) => acc + (p.amount || 0), 0),
                      invoice.currency
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
