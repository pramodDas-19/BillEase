"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  QrCode,
  ReceiptText,
  Clock,
  ArrowUpRight,
  Play,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";

export function LandingHero() {
  const [liveAmount, setLiveAmount] = useState(482450);

  // Subtle real-time ticking amount to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAmount((prev) => prev + Math.floor(Math.random() * 850 + 150));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[450px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur-md animate-pulse">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>NEXT-GEN BILLING PLATFORM</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-medium">GST & Instant UPI Powered</span>
          </div>

          {/* Crazy Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            The High-Velocity{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
              Invoicing & Collection
            </span>{" "}
            Engine.
          </h1>

          {/* High-Converting Subtext */}
          <p className="text-base sm:text-xl text-slate-300/90 max-w-2xl font-normal leading-relaxed">
            Stop chasing unpaid accounts and wrestling with messy spreadsheets. Create tax-compliant invoices in <strong>15 seconds</strong>, trigger <strong>1-click WhatsApp reminders</strong>, and collect payments instantly via <strong>Dynamic UPI QR</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-extrabold rounded-2xl clay-dark-btn text-white group"
            >
              <Sparkles className="w-5 h-5 text-emerald-100 group-hover:rotate-12 transition-transform" />
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#calculator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-bold rounded-2xl clay-dark-btn-secondary text-slate-200 hover:text-white"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Try Interactive Simulator</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant 30-Second Onboarding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Indian GST & UPI Compliant</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Tactile Neo-Clay Showcase */}
        <div className="mt-14 sm:mt-18 relative max-w-5xl mx-auto">
          {/* Glowing Aura Frame */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-cyan-500/20 rounded-3xl blur-xl opacity-75"></div>

          {/* Main Dashboard Preview Container */}
          <div className="relative rounded-3xl clay-dark-card border border-slate-700/80 p-4 sm:p-7 shadow-2xl backdrop-blur-2xl">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40"></div>
                <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline-block">
                  billease-hub://workspace/live-billing
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Multi-Tenant Cloud
                </span>
              </div>
            </div>

            {/* Dashboard Quick Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Gross Billed (This Month)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">
                  ₹{liveAmount.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
                  <span>+34.8% vs last month</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>UPI Instant Collections</span>
                  <QrCode className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">
                  ₹{(liveAmount * 0.92).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-teal-300 mt-1 font-semibold">
                  <span>0% gateway commissions</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Payment Radar</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  0 Overdue Invoices
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-semibold">
                  <span>Automated WhatsApp follow-up</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Invoice & Dynamic UPI QR Card */}
            <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 p-5 sm:p-6 overflow-hidden">
              {/* Paid Stamp Indicator */}
              <div className="absolute top-4 right-4 sm:right-6 rotate-12 pointer-events-none">
                <div className="px-3.5 py-1 rounded-xl border-2 border-emerald-400 text-emerald-400 font-black text-xs sm:text-sm tracking-widest uppercase bg-emerald-500/10 shadow-lg shadow-emerald-950/40">
                  ✓ PAID / SETTLED
                </div>
              </div>

              {/* Invoice Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      INVOICE #INV-2026-0042
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Apex Dynamics Technologies Pvt Ltd
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    GSTIN: <span className="font-mono text-slate-300">27AAACH7409R1ZZ</span> • Place of Supply: Maharashtra (27)
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Due Date</span>
                  <span className="text-xs font-bold text-slate-200">Instant UPI Settlement</span>
                </div>
              </div>

              {/* Line Items Sample */}
              <div className="py-4 space-y-2.5">
                <div className="hidden sm:grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-800/60">
                  <span className="col-span-6">Service / Item Description</span>
                  <span className="col-span-2 text-right">HSN/SAC</span>
                  <span className="col-span-2 text-right">Qty & Rate</span>
                  <span className="col-span-2 text-right">Amount (₹)</span>
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-12 text-xs sm:text-sm text-slate-200 py-1.5 border-b border-slate-800/40">
                  <div className="sm:col-span-6 font-medium text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Enterprise Software Architecture & GST Integration
                  </div>
                  <div className="sm:col-span-2 sm:text-right text-slate-400 text-xs font-mono">998314</div>
                  <div className="sm:col-span-2 sm:text-right text-slate-400 text-xs">1 Qtr × ₹60,000</div>
                  <div className="sm:col-span-2 sm:text-right font-bold text-white">₹60,000.00</div>
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-12 text-xs sm:text-sm text-slate-200 py-1.5">
                  <div className="sm:col-span-6 font-medium text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    Cloud Database Optimization & Security Hardening
                  </div>
                  <div className="sm:col-span-2 sm:text-right text-slate-400 text-xs font-mono">998313</div>
                  <div className="sm:col-span-2 sm:text-right text-slate-400 text-xs">1 Set × ₹25,000</div>
                  <div className="sm:col-span-2 sm:text-right font-bold text-white">₹25,000.00</div>
                </div>
              </div>

              {/* Invoice Footer with UPI QR Code & Summary Totals */}
              <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Dynamic UPI QR Section */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 w-full md:w-auto">
                  <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 flex flex-col items-center justify-center p-1 rounded-lg">
                      {/* Stylized QR Code Graphic */}
                      <div className="w-full h-full border-2 border-emerald-400 rounded flex flex-col items-center justify-center text-center">
                        <QrCode className="w-10 h-10 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">Instant UPI Dynamic QR</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Scan with Google Pay, PhonePe, Paytm, BHIM. Direct to bank settlement.
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400/80">
                      UPI ID: billease@hdfcbank
                    </p>
                  </div>
                </div>

                {/* Totals Strip */}
                <div className="w-full md:w-64 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxable Subtotal:</span>
                    <span className="font-mono font-medium">₹85,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CGST (9%):</span>
                    <span className="font-mono font-medium">₹7,650.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SGST (9%):</span>
                    <span className="font-mono font-medium">₹7,650.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-base font-black text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-400">₹1,00,300.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Superpower Pill 1: WhatsApp Reminder */}
            <div className="absolute -bottom-6 -left-3 sm:-left-6 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl animate-bounce duration-1000">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-white">1-Click WhatsApp Follow-up</p>
                <p className="text-[10px] text-slate-400">Polite reminder & payment link sent</p>
              </div>
            </div>

            {/* Floating Superpower Pill 2: Instant Credit */}
            <div className="absolute -top-6 -right-2 sm:-right-6 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-white">Direct Bank Credit</p>
                <p className="text-[10px] text-slate-400">₹1,00,300 settled in 12 seconds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Stats Bar Below Hero */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-slate-800/80">
          <div className="text-center p-4 rounded-2xl clay-dark-pill">
            <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              2,500+
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Businesses Powered</p>
          </div>

          <div className="text-center p-4 rounded-2xl clay-dark-pill">
            <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
              15 Sec
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Average Invoice Speed</p>
          </div>

          <div className="text-center p-4 rounded-2xl clay-dark-pill">
            <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              78%
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Faster Payment Recovery</p>
          </div>

          <div className="text-center p-4 rounded-2xl clay-dark-pill">
            <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              4.9 / 5
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Customer Trust Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
