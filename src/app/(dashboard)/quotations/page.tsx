import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { QuotationStatusBadge } from "@/components/quotations";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, ArrowUpRight } from "lucide-react";

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotations & Estimates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create flexible estimates, share via PDF or WhatsApp, and convert to invoices.
          </p>
        </div>
        <Link href="/quotations/new">
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Quotation</span>
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_QUOTATIONS.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-semibold text-slate-900">
                  <Link href={`/quotations/${q.id}`} className="hover:text-emerald-600">
                    {q.quotationNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-slate-900">{q.clientName}</p>
                  <p className="text-xs text-slate-400">{q.clientPhone}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(q.date)}</TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(q.validUntil)}</TableCell>
                <TableCell>
                  <QuotationStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900">
                  {formatCurrency(q.totalAmount, q.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/quotations/${q.id}/preview`}>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                        <Eye className="h-3.5 w-3.5 text-slate-500 mr-1" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/quotations/${q.id}`}>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
