import React from "react";
import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingBusinesses } from "@/components/landing/landing-businesses";
import { LandingSuperpowers } from "@/components/landing/landing-superpowers";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";
import { LandingCalculator } from "@/components/landing/landing-calculator";
import { LandingPricingFaq } from "@/components/landing/landing-pricing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://billease.in"),
  title: "BillEase — Smart GST Billing, Instant UPI & WhatsApp Invoicing Platform",
  description:
    "Speed up billing and cash flow recovery. Generate compliant GST invoices in 15 seconds, trigger 1-click WhatsApp payment reminders, and collect instant payments with dynamic UPI QR codes.",
  keywords: [
    "GST Billing Software",
    "Instant UPI Invoicing",
    "WhatsApp Payment Reminders",
    "Thermal Receipt Billing",
    "Multi-Tenant Billing Platform",
    "Quotation to Invoice",
    "SME Accounting India",
  ],
  openGraph: {
    title: "BillEase — The High-Velocity Invoicing & Collection Engine",
    description:
      "Create GST bills in 15 seconds, collect payments with dynamic UPI QR, and recover overdue accounts 3x faster with 1-click WhatsApp alerts.",
    url: "https://billease.in",
    siteName: "BillEase",
    images: [
      {
        url: "/assets/logo/LOGO.png",
        width: 800,
        height: 600,
        alt: "BillEase Platform Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white antialiased overflow-x-hidden">
      {/* Sticky Neo-Clay Navigation Bar */}
      <LandingNavbar />

      {/* 1. Crazy High-Energy Hero Section */}
      <LandingHero />

      {/* 2. Built for Every Business Interactive Flow */}
      <LandingBusinesses />

      {/* 3. Core Superpowers Showcase */}
      <LandingSuperpowers />

      {/* 4. Authentic Testimonials & Social Proof */}
      <LandingTestimonials />

      {/* 5. Interactive Live Preview & Cash Flow ROI Calculator */}
      <LandingCalculator />

      {/* 6. Pricing Preview & Expandable FAQ */}
      <LandingPricingFaq />

      {/* 7. High-Converting Bottom Conversion Banner & Footer */}
      <LandingFooter />
    </main>
  );
}
