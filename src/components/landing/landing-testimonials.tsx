"use client";

import React from "react";
import {
  Star,
  Quote,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Building2,
  Award,
} from "lucide-react";

export function LandingTestimonials() {
  const testimonials = [
    {
      name: "Vikramaditya Sharma",
      role: "Managing Director",
      company: "Apex Media & Growth Agency",
      location: "Bengaluru, Karnataka",
      category: "Creative Agency",
      avatarInitials: "VS",
      avatarColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      rating: 5,
      impact: "72% Reduction in Overdue Invoices",
      highlightMetric: "+₹18.5L Recovered",
      quote:
        "The 1-click WhatsApp payment reminders are pure magic. Before BillEase, our account managers spent half their week in awkward telephone follow-ups. Now, clients receive a polite WhatsApp with a dynamic UPI QR and pay within minutes of invoice generation.",
    },
    {
      name: "Pooja Kulkarni",
      role: "Proprietor & Founder",
      company: "Kulkarni Textiles & Boutique",
      location: "Mumbai, Maharashtra",
      category: "Retail Counter & Walk-ins",
      avatarInitials: "PK",
      avatarColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      rating: 5,
      impact: "15-Second Counter Checkout",
      highlightMetric: "350+ Daily Walk-in Bills",
      quote:
        "During festival rush, billing queues were our biggest bottleneck. With BillEase rapid counter mode and thermal receipt printing, we generate GST bills in under 15 seconds. The printed UPI QR means zero card machine connection errors!",
    },
    {
      name: "Syed Imran Ahmed",
      role: "Principal Contractor",
      company: "Deccan Interior & Civil Infrastructure",
      location: "Hyderabad, Telangana",
      category: "Civil & Interior Contracting",
      avatarInitials: "SA",
      avatarColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      rating: 5,
      impact: "4.5 Hours Saved Every Week",
      highlightMetric: "100% Quote-to-Invoice Accuracy",
      quote:
        "We quote in custom units like Sq Ft, Brass, and Running Ft. In Excel, errors were inevitable. BillEase lets me build estimates directly on my phone at client construction sites, collect 50% advance tokens, and convert accepted quotes to tax invoices in one tap.",
    },
    {
      name: "Rajeshwar Aggarwal",
      role: "Head of Operations",
      company: "Aggarwal Electricals & Wholesale Mart",
      location: "Delhi NCR",
      category: "Wholesale & Goods Trader",
      avatarInitials: "RA",
      avatarColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      rating: 5,
      impact: "Zero GST Filing Mismatches",
      highlightMetric: "GSTR-1 & 3B in 1-Click",
      quote:
        "Our Chartered Accountant used to complain every month about messed up CGST and SGST splits on interstate dispatches. BillEase auto-detects interstate IGST based on GSTIN and gives us clean, error-free exports ready for GST portal upload.",
    },
    {
      name: "Neha Sundaram",
      role: "Independent Product Designer",
      company: "Sundaram Design Studio",
      location: "Pune, Maharashtra",
      category: "Freelancer & Consultant",
      avatarInitials: "NS",
      avatarColor: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      rating: 5,
      impact: "Settled in Under 10 Minutes",
      highlightMetric: "100% On-Time Milestones",
      quote:
        "Clients frequently tell me my invoices look like they were designed by Apple or Linear. The tactile Neo-Clay UI makes my freelance brand look enterprise-level, and the UPI QR code gets me paid without clients making excuses about NEFT wait times.",
    },
    {
      name: "Dharmendra Patel",
      role: "Founder & Director",
      company: "Gujarat Industrial Equipment",
      location: "Ahmedabad, Gujarat",
      category: "Manufacturing & Distribution",
      avatarInitials: "DP",
      avatarColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      rating: 5,
      impact: "Unified Multi-Branch Audit",
      highlightMetric: "₹1.4 Cr+ Annually Billed",
      quote:
        "The multi-tenant architecture gives us complete peace of mind. Our branch managers issue delivery challans and tax invoices with unique numbering sequences, and as the owner, I can see real-time gross receivables from anywhere.",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>VERIFIED CUSTOMER STORIES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Loved by Founders.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Trusted by CAs.
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Discover why retail shops, high-growth digital agencies, civil contractors, and enterprise wholesalers rely on BillEase every single morning.
          </p>
        </div>

        {/* Testimonials 3-Column Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl clay-dark-card border border-slate-800/90 p-7 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300"
            >
              {/* Card Top: Stars & Category Tag */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* 5 Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                    {t.category}
                  </span>
                </div>

                {/* Key Result Banner */}
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t.impact}
                  </span>
                  <span className="font-mono text-[11px] text-teal-300">{t.highlightMetric}</span>
                </div>

                {/* The Quote */}
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed italic font-normal pt-1">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-md ${t.avatarColor}`}
                >
                  {t.avatarInitials}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {t.name}
                    </h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {t.role}, <span className="text-slate-300 font-medium">{t.company}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Social Proof Proof-Points Banner */}
        <div className="mt-16 p-8 rounded-3xl clay-dark-card border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono">99.8%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">On-Time Payment Recovery</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">₹45 Cr+</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Volume Processed Securely</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono">4.9 / 5.0</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">SMB Founder Satisfaction</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-teal-400 font-mono">100%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Indian GST Compliant</p>
          </div>
        </div>
      </div>
    </section>
  );
}
