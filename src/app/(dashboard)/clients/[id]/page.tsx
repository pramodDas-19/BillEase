"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { ClientService } from "@/services/client.service";
import { QuotationService } from "@/services/quotation.service";
import { InvoiceService } from "@/services/invoice.service";
import { Client, Quotation, Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, FileText, Receipt, Loader2, Plus } from "lucide-react";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, allQuotes, allInvs] = await Promise.all([
          ClientService.getClientById(id),
          QuotationService.getQuotations(),
          InvoiceService.getInvoices(),
        ]);
        setClient(c);
        setQuotes((allQuotes || []).filter((q) => q.clientId === id || q.clientName === c?.name));
        setInvoices((allInvs || []).filter((i) => i.clientId === id || i.clientName === c?.name));
      } catch (err) {
        console.error("Failed to load client details:", err);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="clay-icon-squircle p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-xs text-slate-500">{client.companyName || "Direct Client Account"}</p>
          </div>
        </div>

        <Link
          href={`/invoices/new?clientId=${client.id}`}
          className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info card */}
        <Card className="clay-card p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Client Profile</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{client.phone}</span>
            </p>
            {client.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{client.email}</span>
              </p>
            )}
            {client.gstin && (
              <p className="font-bold text-slate-800 pt-1">
                <span>GSTIN: {client.gstin}</span>
              </p>
            )}
            {client.address && (
              <div className="pt-2 border-t border-slate-100 text-[11px]">
                <span className="font-bold text-slate-700">Billing Address:</span>
                <p className="mt-0.5 text-slate-500">{client.address}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Invoices List */}
        <Card className="clay-card p-5 md:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <span>Invoices ({invoices.length})</span>
            </h3>
          </div>

          {invoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No invoices issued for this client yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Link href={`/invoices/${inv.id}/preview`} className="font-bold text-slate-900 hover:text-emerald-600">
                      #{inv.invoiceNumber}
                    </Link>
                    <p className="text-[11px] text-slate-400">{formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
