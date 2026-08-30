import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/invoices";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track billed amounts, partial payments, due dates, and generate client invoices.
          </p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Invoice</span>
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_INVOICES.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-semibold text-slate-900">
                  <Link href={`/invoices/${inv.id}`} className="hover:text-emerald-600">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-slate-900">{inv.clientName}</p>
                  {inv.quotationNumber && (
                    <p className="text-[11px] text-slate-400">From #{inv.quotationNumber}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(inv.issueDate)}</TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(inv.dueDate)}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900">
                  {formatCurrency(inv.totalAmount, inv.currency)}
                </TableCell>
                <TableCell className="text-right font-bold text-amber-700">
                  {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue, inv.currency) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/invoices/${inv.id}/preview`}>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                        <Eye className="h-3.5 w-3.5 text-slate-500 mr-1" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/invoices/${inv.id}`}>
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
