"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Solutions", href: "#solutions" },
    { label: "Superpowers", href: "#superpowers" },
    { label: "Live Simulator", href: "#calculator" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/85 backdrop-blur-xl border-b border-emerald-500/15 shadow-2xl shadow-black/60 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 sm:h-12 px-3 py-1.5 rounded-xl bg-white/95 border border-white/40 shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
            <img
              src="/assets/logo/LOGO.png"
              alt="BillEase"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              BillEase
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Smart GST Billing Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full clay-dark-pill">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 rounded-full transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white rounded-xl clay-dark-btn-secondary"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl clay-dark-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white clay-dark-pill"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-emerald-400" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/80 p-5 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-900 hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold text-slate-200 rounded-xl clay-dark-btn-secondary"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl clay-dark-btn text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Free 14-Day Trial</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
