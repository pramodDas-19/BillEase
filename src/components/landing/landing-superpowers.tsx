"use client";

import React from "react";
import {
  Zap,
  MessageSquare,
  QrCode,
  FileCheck2,
  Landmark,
  ShieldCheck,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  ArrowRight,
} from "lucide-react";

export function LandingSuperpowers() {
  const superpowers = [
    {
      icon: Zap,
      badge: "VELOCITY",
      title: "15-Second Lightning Billing",
      description:
        "Type two letters to auto-populate catalog items, rates, and HSN codes. Calculate taxes and print clean invoices faster than any POS hardware.",
      highlight: "Save 4+ hours every week on mundane paperwork.",
      glowColor: "from-amber-500/20 to-emerald-500/20",
      accent: "text-amber-400",
    },
    {
      icon: MessageSquare,
      badge: "COLLECTIONS",
      title: "1-Click WhatsApp Follow-ups",
      description:
        "No more awkward phone calls chasing money. Send courteous, pre-filled WhatsApp reminder messages with invoice PDF and UPI payment link in 1 tap.",
      highlight: "Recover 78% of delayed payments within 48 hours.",
      glowColor: "from-emerald-500/20 to-teal-500/20",
      accent: "text-emerald-400",
    },
    {
      icon: QrCode,
      badge: "INSTANT UPI",
      title: "Dynamic Embedded UPI QR",
      description:
        "Every invoice and thermal slip features a live dynamic UPI QR code. Clients scan using PhonePe, GPay, or Paytm for instant zero-fee bank settlements.",
      highlight: "0% gateway commissions. 100% direct bank credit.",
      glowColor: "from-cyan-500/20 to-emerald-500/20",
      accent: "text-cyan-400",
    },
    {
      icon: FileCheck2,
      badge: "ESTIMATES ENGINE",
      title: "1-Click Quotation ➔ Invoice",
      description:
        "Draft professional line-item estimates with custom discount formulas. When approved by the client, convert to a tax invoice with a single click.",
      highlight: "Zero double-entry. Flawless revision tracking.",
      glowColor: "from-indigo-500/20 to-cyan-500/20",
      accent: "text-indigo-400",
    },
    {
      icon: Landmark,
      badge: "COMPLIANCE",
      title: "Strict Indian GST & GSTR Export",
      description:
        "Deterministic CGST/SGST vs IGST detection based on GSTIN state codes. Export clean summaries tailored for your CA's GSTR-1 and GSTR-3B filings.",
      highlight: "Eliminates tax calculation errors and notice risks.",
      glowColor: "from-teal-500/20 to-emerald-500/20",
      accent: "text-teal-400",
    },
    {
      icon: Printer,
      badge: "HARDWARE READY",
      title: "Thermal Prints & Offline Sync",
      description:
        "Print standard 58mm / 80mm receipts or generate sleek executive A4 PDFs. Bill customers even during internet drops with local sync architecture.",
      highlight: "Works seamlessly on Android, iOS, Windows and Mac.",
      glowColor: "from-emerald-500/20 to-purple-500/20",
      accent: "text-purple-400",
    },
  ];

  return (
    <section id="superpowers" className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      {/* Ambient background lights */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CORE SUPERPOWERS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Engineered for Velocity.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Built for Cash Flow.
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every feature in BillEase is obsessively crafted to reduce the friction between doing business and having money securely deposited into your bank account.
          </p>
        </div>

        {/* 6-Card Superpowers Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {superpowers.map((sp, idx) => {
            const Icon = sp.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl clay-dark-card border border-slate-800/80 p-7 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300"
              >
                {/* Subtle Card Glow */}
                <div
                  className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${sp.glowColor} rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none`}
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider clay-dark-pill text-slate-300 border border-slate-700">
                      {sp.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    {sp.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {sp.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 relative z-10 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sp.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Feature Callout Strip */}
        <div className="mt-14 p-6 rounded-3xl clay-dark-card border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Multi-Tenant Vault & Cloud Backup
              </h4>
              <p className="text-xs text-slate-400">
                Your client ledgers and invoice archives are encrypted and isolated with multi-tenant architecture.
              </p>
            </div>
          </div>

          <a
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl clay-dark-btn text-xs font-bold text-white"
          >
            <span>Activate Superpowers</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
