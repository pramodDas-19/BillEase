"use client";

import React from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app.config";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ReceiptText,
  Building2,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Layers,
} from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* LEFT SHOWCASE PANEL (Hidden on mobile, 5 cols on lg, 6 cols on xl) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-r border-slate-800/80 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center group">
            <div className="h-20 xl:h-24 px-4 py-2 rounded-2xl bg-white/95 border border-white/40 shadow-xl shadow-emerald-950/50 group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
              <img
                src="/assets/logo/LOGO.png"
                alt="BillEase Logo"
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>
        </div>



        {/* Middle: Value Prop & Floating Live Showcase Card */}
        <div className="relative z-10 my-auto py-8 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Billing & Payments</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Speed up your <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                billing & collections
              </span>
            </h1>
            <p className="text-sm text-slate-300/80 leading-relaxed max-w-md font-medium">
              Create GST estimates in 30 seconds, convert to invoices with 1-click, and track live UPI collections with zero accounting headaches.
            </p>
          </div>

          {/* Floating Glassmorphic Live Invoice Showcase */}
          <div className="relative rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 backdrop-blur-xl shadow-2xl space-y-4 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Grand Hyatt Royal Gala</p>
                  <p className="text-[10px] text-slate-400">INV-2026-089 • Taj Hospitality</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                50% Advance Logged
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left pt-1">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Total Billed</span>
                <span className="text-xs font-extrabold text-white">₹3,45,000</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Paid (UPI)</span>
                <span className="text-xs font-extrabold text-emerald-400">₹1,72,500</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Balance Due</span>
                <span className="text-xs font-extrabold text-amber-400">₹1,72,500</span>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Settlement Progress</span>
                <span className="text-emerald-400">50% Collected</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-1/2 rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-teal-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">WhatsApp Receipt Sent</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Today, 2:45 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom: Trust Badges & Social Proof */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure Multi-Tenant Infrastructure</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
            <span>Built for Growing Businesses</span>
          </div>
        </div>
      </div>

      {/* RIGHT AUTH CANVAS (Mobile full width, 7 cols on lg, 7 cols on xl) */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between items-center p-6 sm:p-10 lg:p-12 bg-slate-900/50 backdrop-blur-sm relative min-h-screen">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Form Container (Vertically centered on all viewports) */}
        <div className="w-full max-w-md relative z-10 my-auto py-4 sm:py-6">
          {/* Mobile Brand Header (Unified directly above the form) */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Link href="/" className="inline-flex items-center group">
              <div className="h-20 px-5 py-2.5 rounded-2xl bg-white/95 border border-white/40 shadow-xl shadow-emerald-950/40 group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
                <img
                  src="/assets/logo/LOGO.png"
                  alt="BillEase Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {children}
        </div>


        {/* Footer: Made in India & Copyright Notice */}
        <div className="relative z-10 pt-4 pb-2 w-full flex flex-col items-center sm:items-end gap-1.5 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/70 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 group select-none hover:border-slate-600">
            {/* Crisp SVG Indian Tricolor Flag */}
            <svg
              className="w-4 h-3 rounded-xs shadow-2xs shrink-0 overflow-hidden"
              viewBox="0 0 24 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="24" height="5.33" fill="#FF9933" />
              <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
              <rect y="10.66" width="24" height="5.33" fill="#138808" />
              <circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.6" fill="none" />
            </svg>

            <span className="text-xs font-extrabold tracking-wide text-slate-200 group-hover:text-white transition-colors">
              Made in India
            </span>

            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </div>

          <p className="text-[11px] font-medium text-slate-500 tracking-wide">
            BillEase v1.0.0 · © 2026 Pramod Das. All rights reserved.
          </p>
        </div>
      </div>


    </div>
  );
}
