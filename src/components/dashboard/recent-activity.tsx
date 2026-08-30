import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { QUOTATION_STATUSES, INVOICE_STATUSES } from "@/constants/status-types";
import { ArrowUpRight } from "lucide-react";

export function RecentQuotationsTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Quotations</CardTitle>
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100">
          {MOCK_QUOTATIONS.slice(0, 4).map((q) => {
            const statusConfig = QUOTATION_STATUSES[q.status];
            return (
              <div key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="text-xs font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {q.quotationNumber}
                    </Link>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{q.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">
                    {formatCurrency(q.totalAmount, q.currency)}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatDate(q.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentInvoicesTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Invoices & Due</CardTitle>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100">
          {MOCK_INVOICES.slice(0, 4).map((inv) => {
            const statusConfig = INVOICE_STATUSES[inv.status];
            return (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-xs font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{inv.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </p>
                  {inv.balanceDue > 0 && (
                    <p className="text-[11px] font-medium text-amber-600">
                      Due: {formatCurrency(inv.balanceDue, inv.currency)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
