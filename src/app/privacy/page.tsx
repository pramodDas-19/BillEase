"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  Download,
  FileText,
  UserCheck,
  Printer,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 10, 2026";

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
                  Privacy & Data Protection
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="clay-icon-squircle flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Policy</span>
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

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="text-center space-y-3 pb-8 sm:pb-10 border-b border-slate-200/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Digital Data Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
            How BillEase protects, handles, and respects your business, client, and financial data.
          </p>
          <p className="text-[11px] text-slate-400 font-semibold">
            Last Updated: {lastUpdated} • Compliant with Indian DPDP Act 2023 & IT Act 2000
          </p>
        </div>

        {/* Highlight Guarantee Card */}
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 shadow-xs flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shrink-0 shadow-xs">
            <EyeOff className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-emerald-950 font-medium">
            <h3 className="font-extrabold text-sm sm:text-base text-emerald-900">
              Our Non-Negotiable Commitment: Zero Data Monetization
            </h3>
            <p>
              We do <strong>not</strong> sell, rent, monetize, or share your business records or client phone numbers with loan aggregators, marketing brokers, or advertising networks. Your customer base and turnover figures remain 100% confidential to your business.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
          {/* Section 1 */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <Database className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2>1. Information We Collect</h2>
            </div>
            <p>
              To provide you with a compliant billing engine and client tracking tools, we collect only the information you explicitly provide:
            </p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Business Identity</strong>: Business name, owner name, email address, phone number, physical address, PAN, and GSTIN (if applicable).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Client Ledger Data</strong>: Customer names, client email/phone numbers, shipping addresses, and GSTIN numbers input by you.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Document Records</strong>: Line items, descriptions, rates, quantities, HSN codes, discounts, invoice amounts, payment receipts, and balance dues.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Banking Details for Invoicing</strong>: Bank name, account number, IFSC code, and UPI ID used solely to render printable invoices and generate dynamic UPI QR payment codes.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p>Your information is processed strictly for the following functional purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Generating professional, GST-compliant PDF invoices, quotations, and payment receipts.</li>
              <li>Calculating real-time invoice balances, taxes, and automatic payment status transitions.</li>
              <li>Formatting 1-click WhatsApp payment reminders and statements initiated by you.</li>
              <li>Rendering on-demand client ledgers and CSV sales registers for your accountants.</li>
              <li>Sending essential account notifications (e.g. password resets, security alerts, and subscription receipts).</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <Lock className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2>3. Data Architecture, Multi-Tenant Isolation & Security</h2>
            </div>
            <p>
              We implement industry-standard technical safeguards to protect your business records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Row-Level Security (RLS)</strong>: All database tables are isolated strictly by tenant ID. Users cannot query, view, or modify invoices or clients belonging to another business.</li>
              <li><strong>Encryption in Transit & At Rest</strong>: All network communications are encrypted via TLS 1.3 (HTTPS), and databases are encrypted at rest using AES-256 standards.</li>
              <li><strong>Zero Credit Card Storage</strong>: We do not store raw credit card numbers or debit card PINs on our servers. Subscription transactions are handled via compliant payment processors.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <Download className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2>4. Your Data Rights (Indian DPDP Act 2023)</h2>
            </div>
            <p>
              Under applicable Indian and global data protection standards, you retain comprehensive rights over your personal and commercial data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Right to Access & Portability</strong>: You can download your complete customer ledger, sales register, and payment history at any moment via one-click CSV export.</li>
              <li><strong>Right to Rectification</strong>: You can update, correct, or amend your business details, GSTIN, and bank coordinates directly in your Settings.</li>
              <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;)</strong>: You may request complete deletion of your account and associated database records upon subscription cancellation.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2>5. Cookies & Local Storage</h2>
            </div>
            <p>
              BillEase uses minimal, functional local storage and cookies strictly necessary to maintain your logged-in session, remember your selected active tenant ID, and preserve your UI preferences (e.g. sidebar collapse state). We do not deploy third-party advertising or cross-site tracking cookies.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="clay-card p-6 sm:p-8 bg-white space-y-3 border-teal-200/80">
            <h2 className="text-slate-900 font-extrabold text-base sm:text-lg">
              6. Data Protection Officer (DPO) Contact
            </h2>
            <p>
              For privacy inquiries, data subject requests, or security concerns, please contact our designated Data Protection Officer:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-medium space-y-1.5">
              <p><strong>Platform:</strong> BillEase by Pramod Das</p>
              <p><strong>Grievance & Data Protection Officer:</strong> Pramod Das (Founder)</p>
              <p><strong>Official Privacy Email:</strong> <a href="mailto:billeasesupport@gmail.com" className="text-emerald-700 font-bold hover:underline">billeasesupport@gmail.com</a></p>
              <p><strong>Jurisdiction:</strong> India</p>
              <p><strong>Response Time:</strong> We acknowledge all formal data privacy inquiries within 48 business hours.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-2 print:hidden">
          <div className="flex items-center justify-center gap-4 font-semibold text-slate-600">
            <Link href="/terms" className="hover:text-slate-900 hover:underline">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-emerald-700 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-slate-900 hover:underline">
              Dashboard
            </Link>
          </div>
          <p>© {new Date().getFullYear()} BillEase by Pramod Das. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
