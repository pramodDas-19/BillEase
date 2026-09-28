"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Heart,
  MessageSquare,
} from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 relative overflow-hidden border-t border-slate-900">
      {/* Background ambient light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* --- HIGH CONVERTING CTA BANNER --- */}
        <div className="py-16">
          <div className="relative rounded-3xl clay-dark-card border border-emerald-500/40 p-8 sm:p-14 overflow-hidden text-center space-y-6 shadow-2xl">
            {/* Banner Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>START YOUR 14-DAY RISK-FREE TRIAL</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Ready to accelerate your billing and get paid on time?
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                Join 2,500+ Indian businesses that replaced delayed client payments and complicated spreadsheets with high-velocity BillEase invoicing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-extrabold rounded-2xl clay-dark-btn text-white group"
                >
                  <Sparkles className="w-5 h-5 text-emerald-100 group-hover:rotate-12 transition-transform" />
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-bold rounded-2xl clay-dark-btn-secondary text-slate-200 hover:text-white"
                >
                  <span>Sign In to Existing Workspace</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Setup in under 30 seconds
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  100% Indian GST & UPI Compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN FOOTER LINKS --- */}
        <div className="py-12 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand (Span 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-11 px-3 py-1.5 rounded-xl bg-white/95 border border-white/40 shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-all flex items-center justify-center">
                <img
                  src="/assets/logo/LOGO.png"
                  alt="BillEase"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  BillEase
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PRO
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Smart Multi-Tenant Billing
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              The high-velocity billing, quotation, and instant collection platform engineered for all business models — agencies, retail shops, contractors, traders, and freelancers.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Product Capabilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#superpowers" className="hover:text-emerald-400 transition-colors">
                  15-Sec Counter Invoicing
                </a>
              </li>
              <li>
                <a href="#superpowers" className="hover:text-emerald-400 transition-colors">
                  1-Click WhatsApp Alerts
                </a>
              </li>
              <li>
                <a href="#superpowers" className="hover:text-emerald-400 transition-colors">
                  Dynamic UPI QR Engine
                </a>
              </li>
              <li>
                <a href="#calculator" className="hover:text-emerald-400 transition-colors">
                  Quote to Invoice Conversion
                </a>
              </li>
              <li>
                <a href="#superpowers" className="hover:text-emerald-400 transition-colors">
                  Thermal Receipt Printing
                </a>
              </li>
              <li>
                <a href="#superpowers" className="hover:text-emerald-400 transition-colors">
                  GSTR-1 & 3B Tax Summaries
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  Agencies & Consultants
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  Retail & Counter Shops
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  Civil & Interior Contractors
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  Wholesalers & Distributors
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  Freelancers & Solopreneurs
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-400 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Staff / Admin Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- BOTTOM STRIP --- */}
        <div className="py-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} BillEase. Engineered by Pramod Das. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <span>🇮🇳 Proudly engineered for Indian SMBs & Global Teams</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
