import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_CLIENTS } from "@/mock/clients.mock";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, Building2, FileText, Receipt } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = MOCK_CLIENTS.find((c) => c.id === id) || MOCK_CLIENTS[0];

  if (!client) {
    notFound();
  }

  const clientQuotes = MOCK_QUOTATIONS.filter((q) => q.clientId === client.id);
  const clientInvoices = MOCK_INVOICES.filter((i) => i.clientId === client.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
          <p className="text-xs text-slate-500">{client.companyName || "Individual Client"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info card */}
        <Card className="space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 border-b pb-2">Client Profile</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{client.phone}</span>
            </p>
            {client.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{client.email}</span>
              </p>
            )}
            {client.gstin && (
              <p className="flex items-center gap-2 font-medium text-slate-800">
                <span>GSTIN: {client.gstin}</span>
              </p>
            )}
            {client.billingAddress && (
              <div className="pt-2 border-t text-[11px]">
                <span className="font-semibold text-slate-700">Billing Address:</span>
                <p className="mt-0.5">{client.billingAddress.street}, {client.billingAddress.city}</p>
              </div>
            )}
          </div>
        </Card>

        {/* History / Quotations & Invoices */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Quotations ({clientQuotes.length})</span>
              </CardTitle>
              <Link href="/quotations/new">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  + New Quote
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 text-xs">
                {clientQuotes.map((q) => (
                  <div key={q.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/quotations/${q.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-600"
                      >
                        {q.quotationNumber}
                      </Link>
                      <span className="ml-2 text-slate-400">{formatDate(q.date)}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(q.totalAmount, q.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-500" />
                <span>Invoices ({clientInvoices.length})</span>
              </CardTitle>
              <Link href="/invoices/new">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  + New Invoice
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 text-xs">
                {clientInvoices.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-600"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span className="ml-2 text-slate-400">{formatDate(inv.issueDate)}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </p>
                      {inv.balanceDue > 0 && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          Due: {formatCurrency(inv.balanceDue, inv.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
