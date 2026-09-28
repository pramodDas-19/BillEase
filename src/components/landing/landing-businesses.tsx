"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Store,
  Hammer,
  Truck,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Printer,
  FileCheck,
  Percent,
  Receipt,
  Sparkles,
} from "lucide-react";

interface IndustryItem {
  id: string;
  icon: any;
  label: string;
  tagline: string;
  description: string;
  features: string[];
  metrics: { value: string; label: string };
  previewDoc: {
    type: string;
    code: string;
    client: string;
    items: { name: string; unit: string; rate: string; total: string }[];
    total: string;
    status: string;
  };
}

export function LandingBusinesses() {
  const industries: IndustryItem[] = [
    {
      id: "agencies",
      icon: Briefcase,
      label: "Agencies & Consultancies",
      tagline: "Retainers, milestones, and high-trust branded proposals.",
      description:
        "Win enterprise contracts with polished PDF quotations, bill milestones with 1-click invoice conversions, and eliminate delayed retainer collections using direct WhatsApp reminders.",
      features: [
        "1-Click Quotation to Tax Invoice conversion",
        "Client lifetime ledger & receivables audit",
        "Pre-formatted WhatsApp retainer follow-ups",
        "Customizable GST / IGST multi-state billing",
      ],
      metrics: { value: "3.5x", label: "Faster Retainer Approvals" },
      previewDoc: {
        type: "PROPOSAL / INVOICE",
        code: "INV-2026-AG09",
        client: "Vanguard Media Global",
        items: [
          { name: "Brand Repositioning Sprint", unit: "1 Month", rate: "₹1,20,000", total: "₹1,20,000" },
          { name: "Performance Ad Creative Suite", unit: "20 Creatives", rate: "₹2,500", total: "₹50,000" },
        ],
        total: "₹2,00,600",
        status: "Accepted & Billed",
      },
    },
    {
      id: "retail",
      icon: Store,
      label: "Retail & Counter Shops",
      tagline: "15-second lightning counter billing & thermal receipts.",
      description:
        "Eliminate checkout queues during peak rush hours. Support walk-in customers in seconds, print standard 58mm/80mm thermal receipts, and collect UPI without hardware POS rental fees.",
      features: [
        "Rapid Walk-in counter mode (no client signup required)",
        "Instant 58mm & 80mm thermal printer support",
        "Embedded UPI QR code on printed paper slips",
        "Daily counter cash & UPI reconciliation summary",
      ],
      metrics: { value: "15 Sec", label: "Per Customer Checkout" },
      previewDoc: {
        type: "POS CASH RECEIPT",
        code: "RCP-COUNTER-812",
        client: "Walk-in Customer (Cash/UPI)",
        items: [
          { name: "Premium Cotton Oxford Shirt", unit: "2 Pcs", rate: "₹1,499", total: "₹2,998" },
          { name: "Leather Formal Belt", unit: "1 Pc", rate: "₹799", total: "₹799" },
        ],
        total: "₹4,480",
        status: "Settled at Counter",
      },
    },
    {
      id: "contractors",
      icon: Hammer,
      label: "Contractors & Service Pros",
      tagline: "Custom dynamic units (Sq Ft, Brass, Days) & partial advances.",
      description:
        "Interior designers, event planners, fabricators, and civil contractors can quote accurately on-site. Define arbitrary units, log partial advance tokens, and track remaining balances effortlessly.",
      features: [
        "Dynamic custom units: Sq Ft, Brass, Sets, Running Ft, Hours",
        "Advance payment chips (20% token, 50% advance, balance due)",
        "Line-item discount & materials labor separation",
        "On-site mobile quoting with immediate WhatsApp PDF dispatch",
      ],
      metrics: { value: "100%", label: "Accuracy in Unit Estimates" },
      previewDoc: {
        type: "CIVIL WORK ESTIMATE",
        code: "EST-2026-CT44",
        client: "Oakridge Luxury Villas",
        items: [
          { name: "Italian Marble Flooring Installation", unit: "1,450 Sq Ft", rate: "₹140", total: "₹2,03,000" },
          { name: "Teak Wood Modular Wardrobes", unit: "3 Units", rate: "₹45,000", total: "₹1,35,000" },
        ],
        total: "₹3,98,840",
        status: "50% Token Received",
      },
    },
    {
      id: "traders",
      icon: Truck,
      label: "Wholesalers & Goods Traders",
      tagline: "HSN/SAC codes, CGST/SGST/IGST compliance & audit trails.",
      description:
        "Manage interstate and intrastate goods dispatches with deterministic Indian GST calculations. Export clean summaries directly for your Chartered Accountant's GSTR-1 and GSTR-3B filings.",
      features: [
        "Automated CGST/SGST vs IGST detection by state code",
        "HSN / SAC item registry with tax rate assignment",
        "Transport & dispatch details on invoice slips",
        "One-click Excel & CSV tax audit ledger export",
      ],
      metrics: { value: "0 Errors", label: "During GST Monthly Filings" },
      previewDoc: {
        type: "TAX INVOICE (GOODS)",
        code: "INV-2026-TR892",
        client: "Metro Hardware Hub (IGST)",
        items: [
          { name: "High-Tensile Steel Fasteners", unit: "500 Boxes", rate: "₹320", total: "₹1,60,000" },
          { name: "Industrial Adhesive Sealants", unit: "120 Cans", rate: "₹450", total: "₹54,000" },
        ],
        total: "₹2,52,520",
        status: "Dispatched & Invoiced",
      },
    },
    {
      id: "freelancers",
      icon: Laptop,
      label: "Freelancers & Solopreneurs",
      tagline: "Zero accounting friction. Instant UPI payment links.",
      description:
        "Designed for solo creators, developers, designers, and marketing experts. Create clean, beautiful bills in seconds that make you look like a Fortune 500 company.",
      features: [
        "Bespoke tactile Neo-Clay invoices that impress clients",
        "No complex accounting jargon to learn",
        "Direct UPI QR printed on invoices for zero-fee payments",
        "Automatic receipts generated and sent via WhatsApp",
      ],
      metrics: { value: "10 Min", label: "Average Settlement Time" },
      previewDoc: {
        type: "FREELANCE INVOICE",
        code: "INV-2026-FL12",
        client: "Fintech Growth Labs",
        items: [
          { name: "Next.js Mobile App Development", unit: "Project", rate: "₹75,000", total: "₹75,000" },
          { name: "UI/UX Interactive Prototyping", unit: "Project", rate: "₹25,000", total: "₹25,000" },
        ],
        total: "₹1,18,000",
        status: "UPI QR Stamped",
      },
    },
  ];

  const [activeTab, setActiveTab] = useState(industries[0].id);
  const current = industries.find((ind) => ind.id === activeTab) || industries[0];
  const IconComponent = current.icon;

  return (
    <section id="solutions" className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      {/* Background radial glow */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BUILT FOR EVERY BUSINESS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            One Engine.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Every Business Workflow.
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            BillEase does not lock you into a rigid model. Whether you trade bulk goods with HSN codes, run busy retail counters, or quote custom civil works by the square foot, everything flows effortlessly.
          </p>
        </div>

        {/* Industry Selector Tabs */}
        <div className="mt-12 flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {industries.map((ind) => {
            const IndIcon = ind.icon;
            const isSelected = ind.id === activeTab;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveTab(ind.id)}
                className={`shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? "clay-dark-card border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-950/30 scale-105"
                    : "clay-dark-pill text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <IndIcon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                <span>{ind.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Card with Interactive Preview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Value Proposition & Features */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Tailored Mode
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {current.label}
                  </h3>
                </div>
              </div>

              <p className="text-emerald-300/90 text-sm sm:text-base font-semibold">
                {current.tagline}
              </p>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Key KPI Metric */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {current.metrics.value}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {current.metrics.label}
                </span>
              </div>

              <a
                href="#calculator"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>Simulate Your Workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Tactile Neo-Clay Live Document Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl clay-dark-card border border-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl">
              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {current.previewDoc.type}
                  </span>
                  <p className="text-xs font-mono text-slate-400 mt-1 font-bold">
                    Ref: {current.previewDoc.code}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {current.previewDoc.status}
                  </span>
                  <p className="text-[10px] text-slate-400">Indian GST Compliant</p>
                </div>
              </div>

              {/* Client Name */}
              <div className="py-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Billed To:</span>
                <p className="text-sm font-bold text-white">{current.previewDoc.client}</p>
              </div>

              {/* Sample Items Table */}
              <div className="space-y-2 py-2 border-y border-slate-800/80">
                {current.previewDoc.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">{it.name}</p>
                      <p className="text-[11px] text-slate-400">{it.unit} @ {it.rate}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-200">{it.total}</span>
                  </div>
                ))}
              </div>

              {/* Summary Bottom Strip */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Total Billed with GST</p>
                  <p className="text-xl font-black text-emerald-400 font-mono">
                    {current.previewDoc.total}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    UPI QR Ready
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    WhatsApp PDF Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
