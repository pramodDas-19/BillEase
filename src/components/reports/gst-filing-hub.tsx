"use client";

import React, { useState, useMemo } from "react";
import { Invoice } from "@/types";
import {
  generateGstr1Report,
  downloadGstr1Json,
  downloadGstr1Csv,
  Gstr1ReportData,
} from "@/lib/gst-engine";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Download,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  FileCode,
  Building2,
  Calendar,
  ShieldCheck,
  Layers,
  ReceiptText,
  Users,
  Package,
  ExternalLink,
} from "lucide-react";

interface GstFilingHubProps {
  invoices: Invoice[];
  businessGstin?: string;
  businessName?: string;
}

export function GstFilingHub({
  invoices,
  businessGstin = "07AAAAA0000A1Z5",
  businessName = "My Business",
}: GstFilingHubProps) {
  // Period Selection State
  const [periodType, setPeriodType] = useState<"month" | "quarter" | "year">("month");

  // Default to current month YYYY-MM
  const currentIso = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentIso);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q2");
  const [activeTab, setActiveTab] = useState<"summary" | "b2b" | "b2c" | "hsn" | "docs">("summary");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Available month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string; fp: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = d.toISOString().slice(0, 7);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      options.push({
        value: val,
        label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        fp: `${mm}${yyyy}`,
      });
    }
    return options;
  }, []);

  // Filter invoices according to selected period
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = inv.issueDate || inv.createdAt;
      if (!invDate) return false;

      if (periodType === "month") {
        return invDate.startsWith(selectedMonth);
      } else if (periodType === "quarter") {
        const monthNum = parseInt(invDate.substring(5, 7), 10);
        if (selectedQuarter === "Q1") return monthNum >= 4 && monthNum <= 6;
        if (selectedQuarter === "Q2") return monthNum >= 7 && monthNum <= 9;
        if (selectedQuarter === "Q3") return monthNum >= 10 && monthNum <= 12;
        if (selectedQuarter === "Q4") return monthNum >= 1 && monthNum <= 3;
        return true;
      }
      return true; // "year"
    });
  }, [invoices, periodType, selectedMonth, selectedQuarter]);

  // Current return period code (MMYYYY for JSON)
  const returnPeriodCode = useMemo(() => {
    if (periodType === "month") {
      const parts = selectedMonth.split("-");
      return `${parts[1]}${parts[0]}`;
    }
    return "042026";
  }, [periodType, selectedMonth]);

  // Compute GSTR-1 & GSTR-3B Report
  const reportData: Gstr1ReportData = useMemo(() => {
    return generateGstr1Report(filteredInvoices, businessGstin, returnPeriodCode);
  }, [filteredInvoices, businessGstin, returnPeriodCode]);

  const { summary } = reportData;

  // Copy portal values helper
  const handleCopyForPortal = () => {
    const text = `GSTR-3B Outward Taxable Supplies (${reportData.periodLabel}):
Taxable Turnover: ₹${summary.taxableTurnover.toLocaleString("en-IN")}
Integrated Tax (IGST): ₹${summary.igst.toLocaleString("en-IN")}
Central Tax (CGST): ₹${summary.cgst.toLocaleString("en-IN")}
State Tax (SGST): ₹${summary.sgst.toLocaleString("en-IN")}
Total Output Tax Liability: ₹${summary.totalTax.toLocaleString("en-IN")}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: GSTIN & Period Controls */}
      <div className="clay-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-tag inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
              <span>GSTIN: {businessGstin || "Not Configured"}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              &bull; Place of Supply Default: Delhi (07)
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mt-1">
            GSTR-1 & GSTR-3B Return Filing Center
          </h2>
          <p className="text-xs text-slate-500">
            Compliant with official GST Portal (<a href="https://gst.gov.in" target="_blank" rel="noreferrer" className="underline font-semibold text-purple-700 inline-flex items-center gap-0.5">gst.gov.in <ExternalLink className="h-2.5 w-2.5" /></a>) offline utility formats.
          </p>
        </div>

        {/* Period Selector & Download Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Mode Toggle */}
          <div className="clay-pill-container p-1 flex items-center gap-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPeriodType("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodType === "month"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType("quarter")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodType === "quarter"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quarterly
            </button>
          </div>

          {/* Month / Quarter Dropdown */}
          {periodType === "month" ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="clay-input py-1.5 px-3 text-xs font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="clay-input py-1.5 px-3 text-xs font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="Q1">Q1 (Apr - Jun 2026)</option>
              <option value="Q2">Q2 (Jul - Sep 2026)</option>
              <option value="Q3">Q3 (Oct - Dec 2026)</option>
              <option value="Q4">Q4 (Jan - Mar 2027)</option>
            </select>
          )}

          {/* Download JSON Button */}
          <button
            onClick={() => downloadGstr1Json(reportData)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition-all cursor-pointer"
            title="Download GSTR-1 JSON for direct upload on gst.gov.in"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Download GSTR-1 JSON</span>
          </button>

          {/* Download CSV Button */}
          <button
            onClick={() => downloadGstr1Csv(reportData)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all cursor-pointer"
            title="Download GSTR-1 Excel/CSV for CA review"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print Action */}
          <button
            onClick={() => window.print()}
            className="clay-icon-squircle p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Print GST Statement"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* GSTR-3B Hero: Outward Taxable Liability (Table 3.1) */}
      <div className="clay-card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                GSTR-3B COMPLIANCE
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Period: {reportData.periodLabel}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1 tracking-tight">
              Table 3.1: Details of Outward Taxable Supplies
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy and enter these numbers directly into Form GSTR-3B on the GST Portal.
            </p>
          </div>

          <button
            onClick={handleCopyForPortal}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all cursor-pointer"
          >
            {copiedNotification ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-700" />
                <span>Copy for GST Portal</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Core Tax Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Taxable Turnover */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              3.1(a) Taxable Turnover
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatCurrency(summary.taxableTurnover, "INR")}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {summary.invoiceCount} active invoices
            </span>
          </div>

          {/* Integrated Tax (IGST) */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
              Integrated Tax (IGST)
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-200 mt-1">
              {formatCurrency(summary.igst, "INR")}
            </div>
            <span className="text-[10px] text-blue-300/70 mt-1 block">Inter-state supplies</span>
          </div>

          {/* Central Tax (CGST) */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Central Tax (CGST)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-200 mt-1">
              {formatCurrency(summary.cgst, "INR")}
            </div>
            <span className="text-[10px] text-emerald-300/70 mt-1 block">Intra-state (50%)</span>
          </div>

          {/* State Tax (SGST) */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
              State Tax (SGST)
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-200 mt-1">
              {formatCurrency(summary.sgst, "INR")}
            </div>
            <span className="text-[10px] text-purple-300/70 mt-1 block">Intra-state (50%)</span>
          </div>
        </div>

        {/* Total Tax Liability Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">
            Total Output Tax Liability to Pay:
          </span>
          <span className="text-base font-black text-amber-300">
            {formatCurrency(summary.totalTax, "INR")}
          </span>
        </div>
      </div>

      {/* GSTR-1 Section Tabs Navigation */}
      <div className="clay-card p-2 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("summary")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "summary"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("b2b")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "b2b"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Table 4A: B2B Invoices ({reportData.b2b.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("b2c")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "b2c"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Table 7: B2C Supplies ({reportData.b2cs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hsn")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "hsn"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Table 12: HSN Summary ({reportData.hsn.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("docs")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "docs"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <ReceiptText className="h-3.5 w-3.5" />
          <span>Table 13: Documents ({reportData.docIssues.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* B2B vs B2C Split Card */}
          <div className="clay-card p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <span>GSTR-1 Outward Split Summary</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of supplies between registered businesses and unregistered buyers.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Table 4A: B2B Supplies
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Registered buyers with valid GSTIN
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {formatCurrency(
                      reportData.b2b.reduce((sum, i) => sum + i.taxableValue, 0),
                      "INR"
                    )}
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold">
                    {reportData.b2b.length} Invoices
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Table 7: B2C Small Supplies
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Retail & unregistered customers
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {formatCurrency(
                      reportData.b2cs.reduce((sum, i) => sum + i.taxableValue, 0),
                      "INR"
                    )}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {reportData.b2cs.reduce((sum, i) => sum + i.invoiceCount, 0)} Invoices
                  </span>
                </div>
              </div>

              {reportData.b2cl.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Table 5A: B2C Large Supplies
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Inter-state unregistered &gt; ₹2.5 Lakhs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {formatCurrency(
                        reportData.b2cl.reduce((sum, i) => sum + i.taxableValue, 0),
                        "INR"
                      )}
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold">
                      {reportData.b2cl.length} Invoices
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How to File Instructions */}
          <div className="clay-card p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>How to File with GST Portal (3 Steps)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow this standard process used by CAs across India.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-purple-900 block">Download GSTR-1 JSON</strong>
                  <span className="text-purple-700">
                    Click the &quot;Download GSTR-1 JSON&quot; button above. BillEase automatically generates the file according to the official GST schema.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-blue-900 block">Upload to gst.gov.in</strong>
                  <span className="text-blue-700">
                    Log in to the GST Portal &rarr; Return Dashboard &rarr; Select Month &rarr; GSTR-1 &rarr; Click &quot;Upload (Offline Utility)&quot; and select your JSON file.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-emerald-900 block">Fill GSTR-3B &amp; Pay</strong>
                  <span className="text-emerald-700">
                    Click &quot;Copy for GST Portal&quot; above, paste the 4 liability numbers into Table 3.1 of GSTR-3B, offset tax, and complete filing!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Table 4A B2B */}
      {activeTab === "b2b" && (
        <div className="clay-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Table 4A: B2B Invoices (Taxable Outward Supplies to Registered Persons)
              </h4>
              <p className="text-[11px] text-slate-400">
                Invoices where client provided a valid 15-character GSTIN.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {reportData.b2b.length} Invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Recipient GSTIN</th>
                  <th className="py-3 px-4">Receiver Name</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">POS</th>
                  <th className="py-3 px-4 text-right">Taxable Val</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.b2b.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No B2B invoices found for this tax period.
                    </td>
                  </tr>
                ) : (
                  reportData.b2b.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">
                        {inv.clientGstin}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{inv.clientName}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{inv.placeOfSupply}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(inv.taxableValue, "INR")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {inv.igst > 0 ? formatCurrency(inv.igst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {inv.cgst > 0 ? formatCurrency(inv.cgst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {inv.sgst > 0 ? formatCurrency(inv.sgst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatCurrency(inv.invoiceValue, "INR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Table 7 B2C Supplies */}
      {activeTab === "b2c" && (
        <div className="clay-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Table 7: B2C Small Supplies (Unregistered Consumers)
              </h4>
              <p className="text-[11px] text-slate-400">
                Aggregated by Place of Supply (State) and Tax Rate.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {reportData.b2cs.length} POS Groups
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Place of Supply</th>
                  <th className="py-3 px-4">Rate (%)</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">Integrated Tax (IGST)</th>
                  <th className="py-3 px-4 text-right">Central Tax (CGST)</th>
                  <th className="py-3 px-4 text-right">State Tax (SGST)</th>
                  <th className="py-3 px-4 text-center">Invoices Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.b2cs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No B2C supplies found for this tax period.
                    </td>
                  </tr>
                ) : (
                  reportData.b2cs.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.placeOfSupply}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{item.taxRate}%</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatCurrency(item.taxableValue, "INR")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {item.igst > 0 ? formatCurrency(item.igst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {item.cgst > 0 ? formatCurrency(item.cgst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {item.sgst > 0 ? formatCurrency(item.sgst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {item.invoiceCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 4: Table 12 HSN Summary */}
      {activeTab === "hsn" && (
        <div className="clay-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Table 12: HSN / SAC Summary of Outward Supplies
              </h4>
              <p className="text-[11px] text-slate-400">
                Grouped by HSN/SAC code with total quantity and tax values.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {reportData.hsn.length} HSN Codes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">HSN / SAC</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">UQC</th>
                  <th className="py-3 px-4 text-center">Total Qty</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.hsn.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No HSN records found for this period.
                    </td>
                  </tr>
                ) : (
                  reportData.hsn.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{h.hsnCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{h.description}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{h.uqc}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {h.totalQuantity}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatCurrency(h.totalTaxableValue, "INR")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {h.igst > 0 ? formatCurrency(h.igst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {h.cgst > 0 ? formatCurrency(h.cgst, "INR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {h.sgst > 0 ? formatCurrency(h.sgst, "INR") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 5: Table 13 Documents Issued */}
      {activeTab === "docs" && (
        <div className="clay-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Table 13: Documents Issued During the Tax Period
              </h4>
              <p className="text-[11px] text-slate-400">
                Tracks serial sequence numbers and cancelled documents.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
              {reportData.docIssues.length} Document Types
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Nature of Document</th>
                  <th className="py-3 px-4">From Serial</th>
                  <th className="py-3 px-4">To Serial</th>
                  <th className="py-3 px-4 text-center">Total Number</th>
                  <th className="py-3 px-4 text-center">Cancelled</th>
                  <th className="py-3 px-4 text-center">Net Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.docIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices issued in this period.
                    </td>
                  </tr>
                ) : (
                  reportData.docIssues.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{doc.natureOfDoc}</td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-semibold">
                        {doc.fromSerial}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-semibold">
                        {doc.toSerial}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {doc.totalCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">
                        {doc.cancelledCount}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-700">
                        {doc.netCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
