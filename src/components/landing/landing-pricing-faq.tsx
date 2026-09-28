"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Zap,
} from "lucide-react";

export function LandingPricingFaq() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const plans = [
    {
      name: "Starter",
      badge: "Free Forever",
      priceMonthly: "₹0",
      priceYearly: "₹0",
      period: "forever",
      description: "For solo freelancers and micro-businesses starting their journey.",
      features: [
        "Up to 15 invoices & quotes / month",
        "Deterministic Indian GST calculations",
        "Dynamic UPI QR code on invoices",
        "Standard executive PDF download",
        "Direct WhatsApp invoice sharing",
        "Single user workspace",
      ],
      ctaText: "Get Started Free",
      ctaLink: "/signup?plan=starter",
      popular: false,
    },
    {
      name: "Pro Business",
      badge: "Most Popular",
      priceMonthly: "₹799",
      priceYearly: "₹639",
      period: "/ month",
      billedYearlyNote: "₹7,668 billed annually (Save 20%)",
      description: "For agencies, retail shops, contractors, and growing SMBs.",
      features: [
        "Unlimited invoices, quotes & receipts",
        "1-Click WhatsApp payment reminders",
        "15-second rapid walk-in counter mode",
        "Thermal printer support (58mm & 80mm)",
        "1-Click Quotation to Tax Invoice conversion",
        "GSTR-1 & GSTR-3B tax export for CA",
        "Custom units (Sq Ft, Brass, Sets, Hours)",
        "Multi-staff roles & permissions",
      ],
      ctaText: "Start 14-Day Free Trial",
      ctaLink: "/signup?plan=pro",
      popular: true,
    },
    {
      name: "Enterprise",
      badge: "High Volume",
      priceMonthly: "₹2,499",
      priceYearly: "₹1,999",
      period: "/ month",
      billedYearlyNote: "₹23,988 billed annually",
      description: "For multi-branch wholesalers, retail chains, and high-volume firms.",
      features: [
        "Everything in Pro Business",
        "Multiple branches & multi-GSTIN support",
        "Custom invoice prefix sequences per branch",
        "Dedicated CA onboarding & ledger import",
        "Automated recurring subscriptions billing",
        "High-priority WhatsApp VIP concierge",
        "Enterprise 99.99% uptime SLA",
      ],
      ctaText: "Contact Enterprise Sales",
      ctaLink: "/signup?plan=enterprise",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "Do I need accounting or bookkeeping experience to use BillEase?",
      answer:
        "Not at all! BillEase was engineered specifically to eliminate accounting headaches. There are no confusing journal entries, debit/credit ledgers, or complicated workflows. You simply enter what you sold, choose your client, and BillEase auto-calculates taxes, generates the invoice, and creates a dynamic UPI QR code instantly.",
    },
    {
      question: "How does BillEase ensure 100% Indian GST compliance?",
      answer:
        "BillEase deterministically determines whether an invoice requires CGST + SGST (intrastate sales) or IGST (interstate sales) based on the client's state code from their GSTIN. It supports HSN/SAC codes, reverse charge flags, and produces 1-click tax summary exports structured for your accountant's GSTR-1 and GSTR-3B filings.",
    },
    {
      question: "Can I use BillEase for walk-in retail billing with a thermal printer?",
      answer:
        "Yes! BillEase includes a high-velocity Counter Mode designed for 15-second customer checkout without requiring client registration. It natively outputs formatted slips for standard 58mm and 80mm thermal receipt printers, including a printed UPI QR code for direct counter payments.",
    },
    {
      question: "How do 1-click WhatsApp follow-ups work?",
      answer:
        "With one tap, BillEase prepares a polite, customized WhatsApp reminder containing the client's name, invoice number, outstanding amount due, and direct UPI payment link. It opens directly in your WhatsApp or WhatsApp Web, so the message comes directly from your official business number without third-party spam triggers.",
    },
    {
      question: "Are dynamic UPI QR payments zero-fee?",
      answer:
        "Yes! Unlike traditional payment gateways that charge 2% to 3% plus GST on every transaction, UPI QR codes printed by BillEase route money directly to your own linked business bank account with 0% gateway deductions and instant settlement.",
    },
    {
      question: "Can my staff use BillEase on their smartphones or tablets?",
      answer:
        "Absolutely. BillEase is a modern progressive web application (PWA) that runs smoothly on iPhones, Android phones, iPads, laptops, and desktop computers. You can even install it on your home screen for instant offline-resilient access.",
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>TRANSPARENT PRICING</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simple, Honest Pricing.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              No Hidden Fees.
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Start free, scale effortlessly. Every plan includes instant UPI QR codes, tax compliance, and multi-tenant security.
          </p>

          {/* Billing Interval Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-xs sm:text-sm font-bold cursor-pointer ${
                billingInterval === "monthly" ? "text-white" : "text-slate-500"
              }`}
              onClick={() => setBillingInterval("monthly")}
            >
              Monthly Billing
            </span>

            <button
              onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-7 rounded-full bg-slate-900 border border-slate-800 p-1 transition-colors focus:outline-none"
              aria-label="Toggle Billing Interval"
            >
              <div
                className={`w-5 h-5 rounded-full bg-emerald-500 shadow-md transition-transform ${
                  billingInterval === "yearly" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>

            <span
              className={`text-xs sm:text-sm font-bold cursor-pointer flex items-center gap-1.5 ${
                billingInterval === "yearly" ? "text-white" : "text-slate-500"
              }`}
              onClick={() => setBillingInterval("yearly")}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SAVE 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? "clay-dark-card border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 lg:-translate-y-3"
                  : "clay-dark-card border border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/60">
                  ★ MOST POPULAR CHOICE
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                      {billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{plan.period}</span>
                  </div>
                  {billingInterval === "yearly" && plan.billedYearlyNote && (
                    <p className="text-[11px] text-emerald-400/90 font-medium mt-1">
                      {plan.billedYearlyNote}
                    </p>
                  )}
                </div>

                {/* Feature List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    What's included:
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link
                  href={plan.ctaLink}
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                    plan.popular
                      ? "clay-dark-btn text-white"
                      : "clay-dark-btn-secondary text-slate-200 hover:text-white"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* --- FAQ ACCORDION SECTION --- */}
        <div id="faq" className="mt-32 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Got Questions? We've Got Answers.
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Everything you need to know about using BillEase for your business.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl clay-dark-card border border-slate-800/90 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-150 font-normal">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
