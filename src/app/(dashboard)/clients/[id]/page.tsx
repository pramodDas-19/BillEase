"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ClientService } from "@/services/client.service";
import { QuotationService } from "@/services/quotation.service";
import { InvoiceService } from "@/services/invoice.service";
import { Client, Quotation, Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { INVOICE_STATUSES, QUOTATION_STATUSES } from "@/constants/status-types";
import { formatWhatsAppPhoneNumber, getWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useTenant } from "@/hooks/use-tenant";
import { ClientEditDialog } from "@/components/clients/client-edit-dialog";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  Receipt,
  Loader2,
  Plus,
  MessageSquare,
  BellRing,
  Edit3,
  Clock,
  ArrowUpRight,
  Tag,
  Wallet,
  ReceiptText,
  CheckCircle2,
} from "lucide-react";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentTenant } = useTenant();
  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"invoices" | "quotes">("invoices");

  // Edit client modal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, allQuotes, allInvs] = await Promise.all([
          ClientService.getClientById(id),
          QuotationService.getQuotations(),
          InvoiceService.getInvoices(),
        ]);
        setClient(c);
        setQuotes((allQuotes || []).filter((q) => q.clientId === id || (c?.name && q.clientName === c.name)));
        setInvoices((allInvs || []).filter((i) => i.clientId === id || (c?.name && i.clientName === c.name)));
      } catch (err) {
        console.error("Failed to load client details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Compute live financial totals from invoices
  const { totalBilled, totalPaid, balanceDue } = useMemo(() => {
    const activeInvoices = invoices.filter((i) => i.status !== "cancelled");
    const computedTotalBilled = activeInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const computedTotalPaid = activeInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const computedBalanceDue = Math.max(0, computedTotalBilled - computedTotalPaid);

    return {
      totalBilled: activeInvoices.length > 0 ? computedTotalBilled : (client?.totalBilled || 0),
      totalPaid: activeInvoices.length > 0 ? computedTotalPaid : (client?.totalPaid || 0),
      balanceDue: activeInvoices.length > 0 ? computedBalanceDue : (client?.balanceDue || 0),
    };
  }, [invoices, client]);

  const handleClientUpdated = (updated: Client) => {
    setClient((prev) => (prev ? { ...prev, ...updated } : updated));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading Client Profile...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Client Not Found</h2>
        <p className="text-xs text-slate-500">The requested client record does not exist in the database.</p>
        <Link
          href="/clients"
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Link>
      </div>
    );
  }

  const cleanPhone = formatWhatsAppPhoneNumber(client.phone);
  const hasDue = balanceDue > 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="clay-icon-squircle p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-colors"
            title="Back to Clients"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {client.name}
              </h1>
              {client.gstin && (
                <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  GST: {client.gstin}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
              {client.companyName ? (
                <>
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{client.companyName}</span>
                </>
              ) : (
                <span>Direct Client Profile</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Call Button */}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              title={`Direct call ${client.name} (${client.phone})`}
              className="clay-icon-squircle flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}

          {/* WhatsApp Direct Chat */}
          {client.phone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`WhatsApp ${client.name}`}
              className="clay-icon-squircle flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white transition-all cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          )}

          {/* WhatsApp Overdue Reminder Button */}
          {hasDue && client.phone && (
            <a
              href={getWhatsAppReminderUrl({
                clientPhone: client.phone,
                clientName: client.name,
                balanceDue,
                businessName: currentTenant?.businessName,
                currency: currentTenant?.settings?.defaultCurrency || "INR",
                customTemplate: currentTenant?.settings?.whatsappReminderTemplate,
              })}
              target="_blank"
              rel="noopener noreferrer"
              title={`Send WhatsApp balance reminder (${formatCurrency(balanceDue, "INR")})`}
              className="clay-tag inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 shadow-2xs transition-all cursor-pointer"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-600" />
              <span>Send Reminder</span>
            </a>
          )}

          {/* Edit Client Profile Button */}
          <button
            onClick={() => setIsEditDialogOpen(true)}
            title="Edit Client Information"
            className="clay-tag inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>

          {/* Create Quote Button */}
          <Link
            href={`/quotations/new?clientId=${client.id}`}
            className="clay-tag inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs transition-all"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>+ Quote</span>
          </Link>

          {/* Create Invoice Button */}
          <Link
            href={`/invoices/new?clientId=${client.id}`}
            className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Invoice</span>
          </Link>
        </div>
      </div>

      {/* 3 Ledger Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Billed */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Billed
            </span>
            <div className="clay-icon-squircle p-2 bg-blue-50 text-blue-700 border border-blue-200/80">
              <ReceiptText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {formatCurrency(totalBilled, "INR")}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Across {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            </p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Total Paid
            </span>
            <div className="clay-icon-squircle p-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-emerald-800">
              {formatCurrency(totalPaid, "INR")}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Cleared & settled collections
            </p>
          </div>
        </div>

        {/* Balance Due */}
        <div
          className={cn(
            "clay-card p-5 bg-gradient-to-br",
            hasDue
              ? "from-amber-50/40 via-white to-orange-50/20"
              : "from-slate-50/80 via-white to-emerald-50/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                hasDue ? "text-amber-700" : "text-emerald-700"
              )}
            >
              Balance Due
            </span>
            <div
              className={cn(
                "clay-icon-squircle p-2 border",
                hasDue
                  ? "bg-amber-50 text-amber-700 border-amber-200/80"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              )}
            >
              {hasDue ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={cn(
                "text-2xl sm:text-[28px] font-bold",
                hasDue ? "text-amber-800" : "text-emerald-800"
              )}
            >
              {formatCurrency(balanceDue, "INR")}
            </h3>
            <p
              className={cn(
                "text-[11px] font-medium mt-1",
                hasDue ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {hasDue ? "Outstanding payment awaiting settlement" : "All accounts fully settled ✨"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Profile (Left) + Document Ledger Tabs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Contact Info Card */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Client Profile</h3>
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Phone</span>
              <p className="flex items-center gap-2 font-semibold text-slate-800 mt-0.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{client.phone}</span>
              </p>
            </div>

            {client.email && (
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Email</span>
                <p className="flex items-center gap-2 font-semibold text-slate-800 mt-0.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </p>
              </div>
            )}

            {client.gstin && (
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">GSTIN</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">
                  {client.gstin}
                </p>
              </div>
            )}

            {client.address && (
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Billing Address</span>
                <p className="flex items-start gap-2 text-slate-600 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{client.address}</span>
                </p>
              </div>
            )}

            {/* Segment Tags */}
            {client.segmentTags && client.segmentTags.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {client.segmentTags.map((tag) => (
                    <span
                      key={tag}
                      className="clay-tag px-2.5 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Ledger Card (Invoices & Quotations) */}
        <div className="lg:col-span-8 clay-card p-5 sm:p-6 space-y-4">
          {/* Segmented Switcher Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-inner self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
                  activeTab === "invoices"
                    ? "bg-white text-emerald-800 shadow-sm border border-slate-200/70"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                <span>Invoices ({invoices.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quotes")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
                  activeTab === "quotes"
                    ? "bg-white text-blue-800 shadow-sm border border-slate-200/70"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Quotations ({quotes.length})</span>
              </button>
            </div>

            {/* Tab Quick Link */}
            {activeTab === "invoices" ? (
              <Link
                href={`/invoices/new?clientId=${client.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Invoice</span>
              </Link>
            ) : (
              <Link
                href={`/quotations/new?clientId=${client.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Quote</span>
              </Link>
            )}
          </div>

          {/* Invoices Tab View */}
          {activeTab === "invoices" && (
            <div>
              {invoices.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">No invoices yet</p>
                    <p className="text-[11px] text-slate-400">Create the first invoice for this client.</p>
                  </div>
                  <Link
                    href={`/invoices/new?clientId=${client.id}`}
                    className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Invoice</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const statusConfig = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.due;
                    return (
                      <div
                        key={inv.id}
                        className="py-3 flex items-center justify-between gap-4 group hover:bg-slate-50/70 rounded-xl px-2 -mx-2 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/invoices/${inv.id}/preview`}
                              className="text-xs font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                            >
                              #{inv.invoiceNumber}
                            </Link>
                            <span
                              className={cn(
                                "clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold border shrink-0",
                                statusConfig.bgClass,
                                statusConfig.textClass,
                                "border-slate-200/80"
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
                            <span>{formatDate(inv.issueDate)}</span>
                            {inv.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {formatDate(inv.dueDate)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                            {formatCurrency(inv.totalAmount, inv.currency)}
                          </span>
                          <span
                            className={cn(
                              "block text-[10px] font-bold mt-0.5",
                              inv.status === "paid"
                                ? "text-emerald-600"
                                : inv.status === "overdue"
                                ? "text-rose-600"
                                : "text-amber-600"
                            )}
                          >
                            {inv.status === "paid"
                              ? "Paid in Full"
                              : `Due: ${formatCurrency(inv.balanceDue, inv.currency)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quotations Tab View */}
          {activeTab === "quotes" && (
            <div>
              {quotes.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">No quotations yet</p>
                    <p className="text-[11px] text-slate-400">Create a price estimate or proposal for this client.</p>
                  </div>
                  <Link
                    href={`/quotations/new?clientId=${client.id}`}
                    className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Quotation</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quotes.map((q) => {
                    const statusConfig = QUOTATION_STATUSES[q.status] || QUOTATION_STATUSES.draft;
                    return (
                      <div
                        key={q.id}
                        className="py-3 flex items-center justify-between gap-4 group hover:bg-slate-50/70 rounded-xl px-2 -mx-2 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/quotations/${q.id}/preview`}
                              className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              #{q.quotationNumber}
                            </Link>
                            <span
                              className={cn(
                                "clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold border shrink-0",
                                statusConfig.bgClass,
                                statusConfig.textClass,
                                "border-slate-200/80"
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
                            <span>{formatDate(q.date)}</span>
                            {q.validUntil && (
                              <>
                                <span>•</span>
                                <span>Valid till {formatDate(q.validUntil)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                            {formatCurrency(q.totalAmount, q.currency)}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                            Estimate Value
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Centralized Edit Client Dialog Modal */}
      <ClientEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        client={client}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
