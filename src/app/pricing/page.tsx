"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenantContext } from "@/context/tenant-context";
import { TenantService } from "@/services/tenant.service";
import { PlanBadge } from "@/components/layout/plan-badge";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  HelpCircle,
  Clock,
  ArrowLeft,
  Printer,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { currentTenant, refreshTenantData } = useTenantContext();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);

  const sub = currentTenant?.subscription;
  const isPaid = sub?.status === "active";
  const isTrial = !sub || sub.status === "trial_active";
  const isEnterprise = isPaid && sub?.plan === "enterprise";

  const handleUpgrade = async (plan: "pro_monthly" | "pro_annual" | "enterprise") => {
    if (!currentTenant?.id) {
      window.location.href = `/signup?plan=${plan}`;
      return;
    }
    setUpgrading(true);
    try {
      await TenantService.updateSubscription(currentTenant.id, {
        plan: plan === "pro_annual" ? "pro_annual" : plan === "enterprise" ? "enterprise" : "pro_monthly",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + (plan === "pro_annual" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      });
      await refreshTenantData();
      setUpgradedPlan(plan === "enterprise" ? "Enterprise" : "Pro Business");
    } catch (e) {
      console.error("Upgrade error:", e);
    } finally {
      setUpgrading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "What happens when my 7-day free trial ends?",
      a: "At the end of 7 days, your account seamlessly transitions to read-only mode if you choose not to upgrade. We will never automatically charge you because no credit card is required to sign up. All your created invoices, quotations, and client records remain 100% safe, readable, and exportable as CSV or PDF forever.",
    },
    {
      q: "Can I switch between monthly and annual plans later?",
      a: "Yes! You can upgrade, downgrade, or switch from monthly to annual billing at any time from your Business Settings. Any unused balance will be prorated automatically toward your new plan.",
    },
    {
      q: "Is BillEase fully compliant with Indian GST Rule 46?",
      a: "Yes. Invoices created in BillEase strictly adhere to Rule 46 of the CGST Rules, 2017. The engine automatically routes Intra-State (CGST + SGST) vs. Inter-State (IGST) taxes based on your client's GSTIN, computes state codes, supports 4-8 digit HSN/SAC codes, and enforces continuous serial numbering.",
    },
    {
      q: "Do you take any transaction commission or charge per invoice?",
      a: "Never. BillEase operates on a 100% flat SaaS subscription model. You can generate 10 or 10,000 invoices every month with zero extra transaction fees or per-bill commissions.",
    },
    {
      q: "How does the Dynamic UPI QR Code work?",
      a: "Every invoice and live preview automatically embeds a standardized Bharat UPI QR code tailored with your VPA (UPI ID), invoice number, and exact outstanding balance. Clients simply scan using GPay, PhonePe, or Paytm, and payments credit directly into your bank account with zero intermediary delay.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="clay-icon-squircle flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-2xs"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-2xl bg-white p-1 flex items-center justify-center border border-slate-200/80 shadow-2xs">
                <img
                  src="/assets/logo/LOGO.png"
                  alt="BillEase Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                  BillEase
                </span>
                <span className="text-[11px] text-slate-400 font-bold block leading-tight">
                  Transparent Pricing
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentTenant?.id ? (
              <>
                <PlanBadge />
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 hidden sm:inline"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>7 Days Free • No Credit Card Required</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
          Simple, Flat Pricing for Growing Businesses
        </h1>
        <p className="text-xs sm:text-base text-slate-500 max-w-xl mx-auto font-medium">
          Start with full unrestricted access for 7 days. Upgrade anytime to enjoy unlimited compliant GST invoicing and automated client collection tracking.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/70 border border-slate-300/80 shadow-inner">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                billingInterval === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5",
                billingInterval === "yearly"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Annual Billing</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-md font-black uppercase tracking-wider",
                billingInterval === "yearly"
                  ? "bg-emerald-950 text-emerald-300"
                  : "bg-emerald-100 text-emerald-800"
              )}>
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* Tier 1: 7-Day Free Trial */}
        <div className="clay-card p-6 sm:p-8 bg-white flex flex-col justify-between border-slate-200/90 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Evaluation
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="h-3 w-3" />
                7 Days Full Access
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">7-Day Free Trial</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Experience all premium features with zero commitment.
              </p>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">₹0</span>
                <span className="text-xs font-bold text-slate-400">/ 7 days</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                No credit card needed
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Unlimited GST Invoices & Estimates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dynamic UPI QR Code generation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>1-Click WhatsApp payment reminders</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>8 Global trade multi-currencies</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>CSV sales register & client ledger export</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            {isTrial && currentTenant?.id ? (
              <div className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Your Current Plan</span>
              </div>
            ) : (
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all shadow-2xs"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Tier 2: Pro Business (Featured) */}
        <div className="clay-card p-6 sm:p-8 bg-gradient-to-b from-emerald-50/60 via-white to-teal-50/40 border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
          {/* Most Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
            <Zap className="h-3 w-3 fill-current" />
            <span>Most Popular</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                Unlimited SaaS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                Flat Monthly Billing
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Pro Business</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Everything you need to automate billing and collect payments faster.
              </p>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {billingInterval === "monthly" ? "₹1,499" : "₹14,990"}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {billingInterval === "monthly" ? "/ month" : "/ year"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                {billingInterval === "monthly"
                  ? "Billed monthly • Cancel anytime"
                  : "₹1,249/mo effective • 2 Months Free"}
              </span>
            </div>

            <div className="pt-4 border-t border-emerald-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-bold text-slate-900">Everything in Free Trial, plus:</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Unlimited invoices, quotations & receipts</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Custom WhatsApp reminder templates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Intelligent Rule 46 GST Auto-Routing</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Commercial Auto Round-Off adjustment</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Unsaved changes data loss guard</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Priority email & WhatsApp customer support</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            {isPaid && !isEnterprise ? (
              <div className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>Your Current Plan (Active)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade(billingInterval === "yearly" ? "pro_annual" : "pro_monthly")}
                disabled={upgrading}
                className="clay-btn-emerald w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{upgrading ? "Upgrading..." : "Upgrade to Pro Business"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 3: Enterprise */}
        <div className="clay-card p-6 sm:p-8 bg-white flex flex-col justify-between border-slate-200/90 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                High Volume
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                <Building2 className="h-3 w-3" />
                Multi-Branch
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Enterprise Agency</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                For agencies, printing presses, and businesses managing multiple entities.
              </p>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {billingInterval === "monthly" ? "₹3,999" : "₹39,990"}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {billingInterval === "monthly" ? "/ month" : "/ year"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                Billed {billingInterval === "monthly" ? "monthly" : "annually"}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-bold text-slate-900">Everything in Pro, plus:</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Multi-branch & multi-GSTIN management</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Custom PDF watermark & white-labeling</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Multiple team logins with role access</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dedicated account manager & phone support</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            {isEnterprise ? (
              <div className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-purple-100 text-purple-900 font-black text-xs border border-purple-300">
                <CheckCircle2 className="h-4 w-4 text-purple-700" />
                <span>Your Current Plan (Active)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade("enterprise")}
                disabled={upgrading}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <span>Upgrade to Enterprise</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Upgrade Celebration Modal */}
      {upgradedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="clay-card w-full max-w-md p-6 sm:p-8 bg-white text-center space-y-4 rounded-3xl shadow-2xl animate-in zoom-in-95">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs mx-auto">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              🎉 Upgraded to {upgradedPlan}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Your subscription is now active. Enjoy unrestricted access to unlimited GST invoicing, automated payment collection reminders, and client tracking.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setUpgradedPlan(null)}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Comparison Matrix */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="text-center space-y-2 pb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Compare Plan Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Transparent breakdown of features included across each tier.
          </p>
        </div>

        <div className="clay-card overflow-x-auto bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="p-4 font-bold text-slate-900">Feature</th>
                <th className="p-4 font-bold text-slate-900 text-center">7-Day Free Trial</th>
                <th className="p-4 font-bold text-emerald-800 text-center bg-emerald-50/50">Pro Business</th>
                <th className="p-4 font-bold text-slate-900 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-4 font-semibold text-slate-900">Invoice & Quotation Volume</td>
                <td className="p-4 text-center">Unlimited for 7d</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Unlimited</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Dynamic UPI QR Codes</td>
                <td className="p-4 text-center">Included</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Included</td>
                <td className="p-4 text-center">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Multi-Currency (INR, USD, EUR, etc.)</td>
                <td className="p-4 text-center">All 8 Currencies</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">All 8 Currencies</td>
                <td className="p-4 text-center">All 8 Currencies</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">WhatsApp 1-Click Reminders</td>
                <td className="p-4 text-center">Standard</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Custom Templates</td>
                <td className="p-4 text-center">Custom Templates</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">GST Rule 46 Auto-Tax Routing</td>
                <td className="p-4 text-center">Included</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Included</td>
                <td className="p-4 text-center">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">CSV & PDF Exports</td>
                <td className="p-4 text-center">Perpetual Free Export</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Perpetual Free Export</td>
                <td className="p-4 text-center">Perpetual Free Export</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Multi-Branch / Multi-GSTIN</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">—</td>
                <td className="p-4 text-center font-bold text-emerald-800">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Customer Support Level</td>
                <td className="p-4 text-center">Standard Email</td>
                <td className="p-4 text-center font-bold text-emerald-800 bg-emerald-50/30">Priority WhatsApp & Email</td>
                <td className="p-4 text-center">Dedicated Account Rep</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="text-center space-y-2 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="clay-card bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
                      isOpen ? "rotate-180 text-emerald-600" : ""
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
        <div className="clay-card p-8 sm:p-10 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center rounded-3xl shadow-xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Take Control of Your Billing?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto font-medium">
            Join thousands of service providers, agencies, freelancers, consultants, contractors, retail shops, and SMBs across India. Start your 7-day free trial in 60 seconds.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer active:scale-[0.99]"
            >
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4 font-semibold text-slate-600">
          <Link href="/pricing" className="text-emerald-700 hover:underline">
            Pricing
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-900 hover:underline">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-900 hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-slate-900 hover:underline">
            Dashboard
          </Link>
        </div>
        <p>© {new Date().getFullYear()} BillEase by Pramod Das. All rights reserved. • Contact: billeasesupport@gmail.com</p>
      </footer>
    </div>
  );
}
