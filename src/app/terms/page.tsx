"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Clock,
  CreditCard,
  Lock,
  Download,
  AlertTriangle,
  Scale,
  Printer,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  QrCode,
  BookOpen,
  ChevronRight,
  Zap,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TermsAndConditionsPage() {
  const lastUpdated = "September 11, 2026";
  const [activeSection, setActiveSection] = useState<string>("section-1");

  const sections = useMemo(() => [
    { id: "section-1", title: "1. Acceptance of Terms" },
    { id: "section-2", title: "2. Definitions" },
    { id: "section-3", title: "3. The Service" },
    { id: "section-4", title: "4. 7-Day Free Trial" },
    { id: "section-5", title: "5. Subscriptions & Billing" },
    { id: "section-6", title: "6. Accounts & Security" },
    { id: "section-7", title: "7. User Content & License" },
    { id: "section-8", title: "8. Indian GST Compliance" },
    { id: "section-9", title: "9. Data Ownership & Retention" },
    { id: "section-10", title: "10. Payment Processing & UPI" },
    { id: "section-11", title: "11. Disclaimer of Warranties" },
    { id: "section-12", title: "12. Limitation of Liability" },
    { id: "section-13", title: "13. Indemnification" },
    { id: "section-14", title: "14. Suspension & Termination" },
    { id: "section-15", title: "15. Changes to Terms" },
    { id: "section-16", title: "16. Governing Law & Dispute" },
    { id: "section-17", title: "17. Miscellaneous" },
    { id: "section-18", title: "18. Contact Information" },
  ], []);

  // Real-time ScrollSpy: dynamically highlights the section currently in reading view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const sorted = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveSection(sorted[0].target.id);
        }
      },
      {
        rootMargin: "-90px 0px -60% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 pb-36">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="clay-icon-squircle flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-2xs"
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
                  Terms of Service
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="clay-icon-squircle flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Document</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="text-center space-y-3 pb-8 border-b border-slate-200/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
            <span>Official Legal Contract • India</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Terms and Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto font-medium">
            Please review these legally binding terms governing your access to and commercial use of the BillEase billing, quotation, and client collection platform.
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-semibold pt-1">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Effective: Immediately</span>
          </div>
        </div>

        {/* Mobile Sticky Table of Contents Jumper */}
        <div className="lg:hidden sticky top-16 z-20 bg-white/95 backdrop-blur-md -mx-4 px-4 py-2.5 border-b border-slate-200/80 shadow-2xs mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <select
              value={activeSection}
              onChange={(e) => scrollToSection(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Column Layout: Sticky Sidebar TOC + Main Legal Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 z-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
            <div className="px-2 py-1.5 mb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                Table of Contents
              </span>
              <span className="text-[10px] font-bold text-slate-400">18 Sections</span>
            </div>

            <nav className="space-y-0.5">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group",
                    activeSection === sec.id
                      ? "bg-emerald-50 text-emerald-900 font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="truncate">{sec.title}</span>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-slate-300 group-hover:text-slate-600 transition-transform shrink-0",
                      activeSection === sec.id ? "text-emerald-600 translate-x-0.5" : ""
                    )}
                  />
                </button>
              ))}
            </nav>
          </aside>

          {/* Right: Detailed Legal Content (All 18 Sections) */}
          <div className="lg:col-span-8 space-y-8 text-sm leading-relaxed text-slate-700">
            {/* 1. Introduction and Acceptance of Terms */}
            <section id="section-1" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>1. Introduction and Acceptance of Terms</h2>
              </div>
              <p>
                <strong>1.1</strong> These Terms and Conditions (&quot;<strong>Terms</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong>User</strong>,&quot; &quot;<strong>you</strong>,&quot; or &quot;<strong>your</strong>&quot;) and <strong>BillEase by Pramod Das</strong>, founded, owned, and operated by <strong>Pramod Das</strong>, under the laws of India (&quot;<strong>BillEase</strong>,&quot; &quot;<strong>Company</strong>,&quot; &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;), governing your access to and use of the BillEase billing, invoicing, and payment-collection platform, including its associated website, web application, and APIs (collectively, the &quot;<strong>Service</strong>&quot;).
              </p>
              <p>
                <strong>1.2</strong> By creating an account, accessing, or using the Service in any manner, you affirm that:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                <li>(a) you are at least 18 years of age and legally capable of entering into a binding contract under the Indian Contract Act, 1872;</li>
                <li>(b) if you are accessing the Service on behalf of a business entity, you have the actual authority to bind that entity to these Terms; and</li>
                <li>(c) you have read, understood, and agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference.</li>
              </ul>
              <p>
                <strong>1.3</strong> If you do not agree to these Terms in their entirety, you must not access or use the Service.
              </p>
              <p>
                <strong>1.4</strong> These Terms apply in addition to, and do not replace, any separately negotiated written agreement between you and BillEase, which shall take precedence over these Terms to the extent of any conflict.
              </p>
            </section>

            {/* 2. Definitions */}
            <section id="section-2" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <BookOpen className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>2. Definitions</h2>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>&quot;Account&quot;</strong>: The unique tenant workspace and isolated database environment created by a User upon registration.
                </li>
                <li>
                  <strong>&quot;Client Data&quot;</strong>: Any data relating to a User&apos;s own customers (names, contact details, billing addresses, GSTINs, transaction histories) uploaded or generated through the Service.
                </li>
                <li>
                  <strong>&quot;Content&quot;</strong>: All data, line items, quotations, invoices, notes, and records submitted to or generated by the Service.
                </li>
                <li>
                  <strong>&quot;Subscription Plan&quot;</strong>: The tier of access selected by the User (7-Day Free Trial, Pro Monthly, Pro Annual, or Enterprise) as published on our Pricing page.
                </li>
                <li>
                  <strong>&quot;Tax Invoice&quot; and &quot;GST&quot;</strong>: Documents and computations governed by the Central Goods and Services Tax Act, 2017, and rules promulgated thereunder.
                </li>
              </ul>
            </section>

            {/* 3. The Service */}
            <section id="section-3" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Zap className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>3. The Service</h2>
              </div>
              <p>
                <strong>3.1</strong> BillEase provides a software-as-a-service platform that enables small and medium businesses to create quotations, generate tax invoices, record payments, and manage client billing relationships.
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs font-semibold">
                <strong>3.2 Advisory Disclaimer:</strong> BillEase is a <strong>software tool</strong>, not a financial institution, payment aggregator, chartered accountancy firm, GST Suvidha Provider (&quot;GSP&quot;), or licensed tax advisory service. Nothing in the Service constitutes financial, tax, legal, or accounting advice.
              </div>
              <p>
                <strong>3.3</strong> We reserve the right to modify, optimize, or discontinue features of the Service with reasonable notice for material changes affecting core paid functionality.
              </p>
            </section>

            {/* 4. Free Trial */}
            <section id="section-4" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>4. 7-Day Free Trial Policy</h2>
              </div>
              <p>
                <strong>4.1</strong> New Accounts receive a <strong>7-Day Free Trial Period</strong> from the date of registration, granting full access to all features described on our Pricing page.
              </p>
              <p>
                <strong>4.2</strong> No credit card or upfront payment method is required to begin the Trial Period, and you will <strong>never</strong> be automatically charged upon its expiry.
              </p>
              <p>
                <strong>4.3</strong> Upon expiry of the 7-day Trial Period without an active paid Subscription Plan, your Account transitions to restricted read-only mode. Your existing Content remains 100% preserved and exportable as CSV or PDF for at least <strong>90 days</strong> following trial expiry.
              </p>
            </section>

            {/* 5. Subscription Plans, Billing, and Cancellation */}
            <section id="section-5" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <CreditCard className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>5. Subscription Plans, Billing, and Cancellation</h2>
              </div>
              <p>
                <strong>5.1 Billing:</strong> Following the Trial Period, continued access requires an active paid Subscription Plan, billed in advance on a monthly or annual basis as selected by you.
              </p>
              <p>
                <strong>5.2 Price Changes:</strong> We will provide at least <strong>30 days&apos; prior notice</strong> of any subscription price adjustments applicable to existing renewals.
              </p>
              <p>
                <strong>5.3 Auto-Renewal & Grace Period:</strong> Subscriptions renew automatically unless cancelled prior to renewal. If a payment fails, we provide a <strong>7-day grace period</strong> with read-only access while payment retries execute.
              </p>
              <p>
                <strong>5.4 Cancellation:</strong> You may cancel anytime via Account Settings. Cancellation takes effect at the end of the current paid billing cycle.
              </p>
              <p>
                <strong>5.5 Refunds:</strong> Subscription fees are non-refundable for partial monthly cycles once service is provisioned, except where mandated by Indian consumer protection laws.
              </p>
              <p>
                <strong>5.6 Taxes:</strong> All published fees are exclusive of applicable Indian GST (18%), which will be itemized on the tax invoice issued to you.
              </p>
            </section>

            {/* 6. User Accounts and Security */}
            <section id="section-6" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Lock className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>6. User Accounts and Security</h2>
              </div>
              <p>
                <strong>6.1</strong> You are responsible for safeguarding your login credentials and for all activities under your Account.
              </p>
              <p>
                <strong>6.2 Prohibited Conduct:</strong> You agree not to:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                <li>(a) create, transmit, or store fraudulent, fictitious, or knowingly false invoices or tax documents;</li>
                <li>(b) attempt to circumvent or tamper with the multi-tenant database isolation, rate limits, or security barriers;</li>
                <li>(c) reverse-engineer, decompile, or extract the source code of the Service;</li>
                <li>(d) deploy automated scraping bots or unauthorized API extraction tools;</li>
                <li>(e) transmit abusive, defamatory, or unlawful statements via invoice notes or WhatsApp templates; or</li>
                <li>(f) violate the Information Technology Act, 2000, or any other statutory regulation.</li>
              </ul>
            </section>

            {/* 7. User Content and License */}
            <section id="section-7" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>7. User Content and License</h2>
              </div>
              <p>
                <strong>7.1 100% Ownership:</strong> As between you and BillEase, you retain all right, title, and intellectual property interest in and to your Content and Client Data. BillEase claims zero ownership over your records.
              </p>
              <p>
                <strong>7.2 Limited Operational License:</strong> You grant BillEase a limited, non-exclusive license solely to host, process, calculate, and display your Content to provide the Service, render payment QR codes, and generate exportable documents.
              </p>
              <p>
                <strong>7.3 Accuracy:</strong> You remain solely responsible for the correctness and legality of all client data, tax rates, and prices entered. BillEase conducts no independent verification of your business numbers.
              </p>
            </section>

            {/* 8. Indian GST and Tax Compliance */}
            <section id="section-8" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 border-emerald-200 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>8. Indian GST and Tax Compliance (Rule 46)</h2>
              </div>
              <p>
                <strong>8.1</strong> BillEase provides automated tools intended to assist Users in producing documents consistent with <strong>Rule 46 of the Central Goods and Services Tax Rules, 2017</strong>.
              </p>
              <div className="space-y-2 pl-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Taxpayer Responsibility:</strong> You are solely responsible for entering your authentic GSTIN, recipient GSTINs, valid HSN/SAC codes, and appropriate tax rates (CGST, SGST, IGST).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>GSP Disclaimer:</strong> BillEase is not a government GSP/ASP or e-way bill portal. Using BillEase does not replace or substitute your legal duty to file monthly/quarterly returns (GSTR-1, GSTR-3B) with the GSTN.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Consecutive Numbering:</strong> You agree to maintain unique, consecutive document numbering for each financial year.</span>
                </div>
              </div>
            </section>

            {/* 9. Data Ownership, Portability, and Retention */}
            <section id="section-9" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Download className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>9. Data Ownership, Portability, and Retention</h2>
              </div>
              <p>
                <strong>9.1 Perpetual Export Rights:</strong> You can download your Sales Register, Collections Log, and Client Ledger as standardized CSV and PDF files at any time during active subscriptions, free trials, and for at least <strong>90 days</strong> following account closure.
              </p>
              <p>
                <strong>9.2 DPDP Act 2023:</strong> In accordance with the Digital Personal Data Protection Act, 2023, you act as the Data Fiduciary for your client records, and BillEase operates strictly as a Data Processor under your instructions.
              </p>
            </section>

            {/* 10. Third-Party Services and Payment Processing */}
            <section id="section-10" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <QrCode className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>10. Third-Party Services and Payment Processing</h2>
              </div>
              <p>
                <strong>10.1 Non-Custodial Architecture:</strong> BillEase facilitates the display of Bharat UPI QR codes and bank account details. BillEase <strong>does not hold, custody, or intermediate your funds</strong>. All client payments credit directly to your designated bank account via NPCI banking rails.
              </p>
              <p>
                <strong>10.2 Third-Party Rails:</strong> BillEase is not liable for UPI network latency, bank server downtime, or WhatsApp transmission delays beyond our direct software interface.
              </p>
            </section>

            {/* 11. Disclaimer of Warranties */}
            <section id="section-11" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />
                <h2>11. Disclaimer of Warranties</h2>
              </div>
              <p className="uppercase text-xs font-semibold text-slate-500 leading-relaxed">
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </section>

            {/* 12. Limitation of Liability */}
            <section id="section-12" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <h2>12. Limitation of Liability</h2>
              </div>
              <p className="uppercase text-xs font-semibold text-slate-500 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL BILLEASE OR ITS DIRECTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, LOSS OF PROFITS, OR STATUTORY GST PENALTIES AND AUDIT ASSESSMENTS.
              </p>
              <p>
                <strong>12.2 Liability Cap:</strong> BillEase&apos;s aggregate cumulative liability arising out of or related to these Terms shall not exceed the subscription fees actually paid by you to BillEase in the <strong>three (3) months</strong> immediately preceding the claim.
              </p>
            </section>

            {/* 13. Indemnification */}
            <section id="section-13" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Scale className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>13. Indemnification</h2>
              </div>
              <p>
                You agree to defend, indemnify, and hold harmless BillEase and its officers from any claims, losses, or legal costs arising from: (a) your breach of these Terms; (b) tax or GST law violations; (c) customer billing disputes; or (d) unauthorized submission of client personal data.
              </p>
            </section>

            {/* 14. Suspension and Termination */}
            <section id="section-14" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>14. Suspension and Termination</h2>
              </div>
              <p>
                <strong>14.1 By You:</strong> You may terminate your Account at any time via Settings.
              </p>
              <p>
                <strong>14.2 By BillEase:</strong> We may suspend or terminate accounts for material breaches with a 7-day cure window, or immediately if required by law or security necessity.
              </p>
              <p>
                <strong>14.3 Survival:</strong> Provisions regarding ownership, liability limitations, indemnities, and arbitration survive termination.
              </p>
            </section>

            {/* 15. Changes to These Terms */}
            <section id="section-15" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>15. Changes to These Terms</h2>
              </div>
              <p>
                Material modifications will be notified at least <strong>15 days in advance</strong> via email or in-app announcement. Continued use following the effective date signifies your consent.
              </p>
            </section>

            {/* 16. Governing Law and Dispute Resolution */}
            <section id="section-16" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Scale className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>16. Governing Law and Arbitration</h2>
              </div>
              <p>
                <strong>16.1 Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of the Republic of India.
              </p>
              <p>
                <strong>16.2 Arbitration:</strong> Unresolved disputes shall be referred to and finally resolved by sole-arbitrator arbitration under the <strong>Arbitration and Conciliation Act, 1996</strong>. The seat of arbitration shall be Mumbai, India, conducted in English.
              </p>
              <p>
                <strong>16.3 Jurisdiction:</strong> Competent courts in India shall possess exclusive jurisdiction over matters not subject to arbitration.
              </p>
            </section>

            {/* 17. Miscellaneous */}
            <section id="section-17" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>17. Miscellaneous Provisions</h2>
              </div>
              <p>
                These Terms constitute the entire agreement between you and BillEase. If any provision is held unenforceable, remaining clauses continue in full effect. Neither party is liable for delays caused by force majeure events beyond reasonable control.
              </p>
            </section>

            {/* 18. Contact Information */}
            <section id="section-18" className="clay-card p-6 sm:p-8 bg-white space-y-3.5 border-emerald-200 scroll-mt-24">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base sm:text-lg border-b border-slate-100 pb-2.5">
                <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2>18. Contact Information & Legal Notices</h2>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium space-y-1.5 text-slate-700">
                <p><strong>Platform:</strong> BillEase by Pramod Das</p>
                <p><strong>Founder & Operator:</strong> Pramod Das</p>
                <p><strong>Official Support Email:</strong> <a href="mailto:billeasesupport@gmail.com" className="text-emerald-700 font-bold hover:underline">billeasesupport@gmail.com</a></p>
                <p><strong>Support Window:</strong> Monday–Saturday, 9:00 AM–6:00 PM IST (Email & in-app support)</p>
                <p><strong>Location:</strong> India</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-2 print:hidden">
          <div className="flex items-center justify-center gap-4 font-semibold text-slate-600">
            <Link href="/terms" className="text-emerald-700 hover:underline">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-900 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-slate-900 hover:underline">
              Pricing
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-slate-900 hover:underline">
              Dashboard
            </Link>
          </div>
          <p>© {new Date().getFullYear()} BillEase by Pramod Das. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
