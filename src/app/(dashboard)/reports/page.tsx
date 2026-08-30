import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart2, CheckCircle2, AlertTriangle, Users } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Financial Reports & Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track cash collection efficiency, quotation win rates, and overdue receivables.
        </p>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-500 font-semibold">Quotation Conversion Rate</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">67%</h3>
          <p className="text-[11px] text-slate-400 mt-1">Quotes converted into billed invoices</p>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-500 font-semibold">Invoiced vs Collected</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">47.4%</h3>
          <p className="text-[11px] text-slate-400 mt-1">₹ 95,850 collected of ₹ 2,02,050</p>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-500 font-semibold">Aging Overdue Receivables</p>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">₹ 38,350</h3>
          <p className="text-[11px] text-slate-400 mt-1">Overdue past 15 days</p>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Month-over-Month Revenue & Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Total Invoiced</TableHead>
                <TableHead className="text-right">Total Collected</TableHead>
                <TableHead className="text-right">Outstanding Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { month: "August 2026", invoiced: 202050, collected: 95850, pending: 106200 },
                { month: "July 2026", invoiced: 155000, collected: 140000, pending: 15000 },
                { month: "June 2026", invoiced: 130000, collected: 110000, pending: 20000 },
                { month: "May 2026", invoiced: 95000, collected: 90000, pending: 5000 },
              ].map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-semibold text-slate-900">{row.month}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(row.invoiced, "INR")}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(row.collected, "INR")}</TableCell>
                  <TableCell className="text-right font-medium text-amber-700">{formatCurrency(row.pending, "INR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
