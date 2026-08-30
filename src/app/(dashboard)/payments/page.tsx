import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MOCK_PAYMENTS } from "@/mock/payments.mock";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments Received</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger of settlements, bank transfers, and UPI collections.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Invoice Ref</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Reference / Txn ID</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PAYMENTS.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-bold text-slate-900">{p.paymentNumber}</TableCell>
                <TableCell className="font-medium text-slate-900">{p.clientName}</TableCell>
                <TableCell>
                  <Link href={`/invoices/${p.invoiceId}`} className="text-emerald-600 hover:underline text-xs font-semibold">
                    {p.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(p.paymentDate)}</TableCell>
                <TableCell>
                  <span className="capitalize px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-xs">
                    {p.paymentMethod.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{p.transactionReference || "—"}</TableCell>
                <TableCell className="text-right font-extrabold text-emerald-700">
                  {formatCurrency(p.amount, p.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
