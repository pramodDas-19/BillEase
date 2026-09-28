"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  QrCode,
  Sparkles,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ReceiptText,
  Sliders,
  RefreshCw,
  Coins,
} from "lucide-react";

export function LandingCalculator() {
  const [activeMode, setActiveMode] = useState<"simulator" | "roi">("simulator");

  // --- Simulator State ---
  const [businessPreset, setBusinessPreset] = useState<"agency" | "retail" | "contractor" | "freelancer">("agency");
  const [itemName, setItemName] = useState("Full-Stack Web App Development");
  const [unit, setUnit] = useState("Sprint");
  const [quantity, setQuantity] = useState(2);
  const [rate, setRate] = useState(35000);
  const [gstRate, setGstRate] = useState(18); // percentage
  const [discountPercent, setDiscountPercent] = useState(0);
  const [whatsappSent, setWhatsappSent] = useState(false);

  // Preset switch helper
  const applyPreset = (type: "agency" | "retail" | "contractor" | "freelancer") => {
    setBusinessPreset(type);
    setWhatsappSent(false);
    if (type === "agency") {
      setItemName("Full-Stack Web App Development");
      setUnit("Sprint");
      setQuantity(2);
      setRate(35000);
      setGstRate(18);
      setDiscountPercent(0);
    } else if (type === "retail") {
      setItemName("Designer Linen Shirts & Denim");
      setUnit("Pcs");
      setQuantity(3);
      setRate(1899);
      setGstRate(5);
      setDiscountPercent(5);
    } else if (type === "contractor") {
      setItemName("Italian Marble Flooring & Polish");
      setUnit("Sq Ft");
      setQuantity(1200);
      setRate(135);
      setGstRate(18);
      setDiscountPercent(0);
    } else if (type === "freelancer") {
      setItemName("Brand Identity & UI Design System");
      setUnit("Project");
      setQuantity(1);
      setRate(45000);
      setGstRate(18);
      setDiscountPercent(0);
    }
  };

  // Calculations for Simulator
  const rawSubtotal = quantity * rate;
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const taxableAmount = rawSubtotal - discountAmount;
  const cgstAmount = (taxableAmount * (gstRate / 2)) / 100;
  const sgstAmount = (taxableAmount * (gstRate / 2)) / 100;
  const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount);

  // --- ROI Calculator State ---
  const [monthlyVolume, setMonthlyVolume] = useState(1500000); // 15 Lakhs
  const [delayDays, setDelayDays] = useState(28); // 28 days delay

  // ROI calculations
  const roiResults = useMemo(() => {
    // Faster collection saves working capital interest (estimated 12% p.a. cost of delayed capital)
    // BillEase reduces delays by ~65%
    const daysSaved = Math.round(delayDays * 0.65);
    const dailyVolume = monthlyVolume / 30;
    const workingCapitalUnlocked = Math.round(dailyVolume * daysSaved);
    const annualInterestSaved = Math.round(workingCapitalUnlocked * 0.12);
    const adminHoursSaved = 5.5; // average weekly hours saved

    return {
      daysSaved,
      workingCapitalUnlocked,
      annualInterestSaved,
      adminHoursSaved,
    };
  }, [monthlyVolume, delayDays]);

  return (
    <section id="calculator" className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      {/* Radiant Background Blur */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[350px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full clay-dark-pill text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-3.5 h-3.5" />
            <span>INTERACTIVE PLAYGROUND</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Try BillEase Live.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              No Sign Up Required.
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Test our real-time GST calculation and instant UPI QR engine below, or calculate how much working capital your business unlocks with 1-click reminders.
          </p>

          {/* Mode Selector Toggle */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveMode("simulator")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeMode === "simulator"
                    ? "clay-dark-card border-emerald-500/40 text-emerald-400 shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                <span>Live Bill & Dynamic QR Simulator</span>
              </button>

              <button
                onClick={() => setActiveMode("roi")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeMode === "roi"
                    ? "clay-dark-card border-emerald-500/40 text-emerald-400 shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Cash Flow ROI Calculator</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- TAB 1: LIVE BILL & DYNAMIC QR SIMULATOR --- */}
        {activeMode === "simulator" && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls Panel */}
            <div className="lg:col-span-6 rounded-3xl clay-dark-card border border-slate-800 p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-extrabold text-white">
                    Interactive Bill Builder
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/80 font-semibold">
                  LIVE ENGINE
                </span>
              </div>

              {/* Industry Preset Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quick Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => applyPreset("agency")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      businessPreset === "agency"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    Agency
                  </button>
                  <button
                    onClick={() => applyPreset("retail")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      businessPreset === "retail"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    Retail Shop
                  </button>
                  <button
                    onClick={() => applyPreset("contractor")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      businessPreset === "contractor"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    Contractor
                  </button>
                  <button
                    onClick={() => applyPreset("freelancer")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      businessPreset === "freelancer"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    Freelancer
                  </button>
                </div>
              </div>

              {/* Item Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Item / Service Description
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white clay-dark-input focus:outline-none"
                />
              </div>

              {/* Quantity, Unit & Rate Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 rounded-xl text-xs text-white clay-dark-input focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs text-white clay-dark-input focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Rate (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 rounded-xl text-xs text-white clay-dark-input focus:outline-none"
                  />
                </div>
              </div>

              {/* GST Slab Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Indian GST Slab</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    CGST {gstRate / 2}% + SGST {gstRate / 2}%
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 5, 12, 18, 28].map((slab) => (
                    <button
                      key={slab}
                      onClick={() => setGstRate(slab)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                        gstRate === slab
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-950"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      {slab}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Percentage Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Discount</span>
                  <span className="text-emerald-400 font-mono">{discountPercent}% (₹{discountAmount.toLocaleString("en-IN")})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Interactive WhatsApp Test Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => setWhatsappSent(true)}
                  className="w-full py-3 px-4 rounded-xl clay-dark-btn-secondary text-xs font-extrabold flex items-center justify-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Simulate 1-Click WhatsApp Follow-up Message</span>
                </button>

                {whatsappSent && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200 animate-in fade-in duration-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      WhatsApp Message Preview (Pre-filled):
                    </p>
                    <p className="font-mono text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      "Dear Client, your bill of <strong className="text-white">₹{grandTotal.toLocaleString("en-IN")}</strong> for {itemName} has been generated. Please scan the attached UPI QR or click to settle: https://billease.in/pay/sim-88"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Live Tactile Neo-Clay Preview Panel */}
            <div className="lg:col-span-6 rounded-3xl clay-dark-card border border-emerald-500/30 p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
              {/* Top Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Live Rendered Tax Invoice</h4>
                    <p className="text-[10px] font-mono text-slate-400">ID: INV-SIMULATOR-2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ● Real-Time Sync
                  </span>
                </div>
              </div>

              {/* Dynamic Line Item Render */}
              <div className="py-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>Particulars</span>
                  <span>Amount (INR)</span>
                </div>

                <div className="flex items-start justify-between text-xs sm:text-sm py-1">
                  <div>
                    <p className="font-semibold text-white">{itemName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {quantity} {unit} × ₹{rate.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ₹{rawSubtotal.toLocaleString("en-IN")}.00
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-400">
                    <span>Discount ({discountPercent}% applied)</span>
                    <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN")}.00</span>
                  </div>
                )}
              </div>

              {/* Taxes & Dynamic UPI QR Split */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Taxable Value:</span>
                  <span className="font-mono">₹{taxableAmount.toLocaleString("en-IN")}.00</span>
                </div>

                {gstRate > 0 ? (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono">₹{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono">₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GST Exempt / Nil Rated</span>
                    <span>₹0.00</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Final Amount Payable:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Dynamic UPI QR Code Preview Box */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shrink-0 shadow-lg">
                  <div className="w-20 h-20 bg-slate-950 flex flex-col items-center justify-center p-1 rounded-lg">
                    <QrCode className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">
                      Scan to Pay ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Direct Bank
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Works on GPay, PhonePe, Paytm, CRED. Auto-marks invoice as Settled upon credit.
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400">
                    upi://pay?pa=billease@hdfcbank&am={grandTotal}&cu=INR
                  </p>
                </div>
              </div>

              {/* Next Step CTA */}
              <div className="mt-6 text-center">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl clay-dark-btn text-xs font-bold text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Use This Invoice In Your Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CASH FLOW RECOVERY ROI CALCULATOR --- */}
        {activeMode === "roi" && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Input */}
            <div className="lg:col-span-6 rounded-3xl clay-dark-card border border-slate-800 p-6 sm:p-8 space-y-8">
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Working Capital Delay Assessment
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust the sliders to mirror your current billing volume and client payment timelines.
                </p>
              </div>

              {/* Slider 1: Monthly Billed Volume */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-300">
                    Monthly Gross Billing Volume:
                  </label>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ₹{monthlyVolume.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="5000000"
                  step="50000"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹2 Lakhs</span>
                  <span>₹25 Lakhs</span>
                  <span>₹50 Lakhs</span>
                </div>
              </div>

              {/* Slider 2: Average Delay Days */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-300">
                    Average Client Payment Delay:
                  </label>
                  <span className="text-lg font-black text-teal-400 font-mono">
                    {delayDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="60"
                  step="1"
                  value={delayDays}
                  onChange={(e) => setDelayDays(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>7 Days (Fast)</span>
                  <span>30 Days (Standard)</span>
                  <span>60 Days (Severe)</span>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>The BillEase Effect</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automated polite WhatsApp payment reminders + dynamic UPI QR codes reduce payment turnaround by an average of <strong>65%</strong> across all Indian industries.
                </p>
              </div>
            </div>

            {/* Calculated Results Card */}
            <div className="lg:col-span-6 rounded-3xl clay-dark-card border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  PROJECTED CASH FLOW IMPACT
                </span>
                <h3 className="text-2xl font-black text-white">
                  Your Immediate Capital Advantage
                </h3>
              </div>

              {/* Big Stat 1: Working Capital Unlocked */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold text-emerald-300">
                  Estimated Working Capital Unlocked
                </span>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono">
                  ₹{roiResults.workingCapitalUnlocked.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-400">
                  Money credited directly to your bank account {roiResults.daysSaved} days sooner.
                </p>
              </div>

              {/* Stat 2 & 3 Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Interest / Cost Saved</span>
                  <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                    ₹{roiResults.annualInterestSaved.toLocaleString("en-IN")}/yr
                  </p>
                  <span className="text-[10px] text-slate-500">Based on 12% p.a. capital cost</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Admin Time Reclaimed</span>
                  <p className="text-xl font-extrabold text-teal-300 font-mono mt-1">
                    {roiResults.adminHoursSaved} Hrs/wk
                  </p>
                  <span className="text-[10px] text-slate-500">Zero manual follow-up calls</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl clay-dark-btn text-sm font-extrabold text-white"
              >
                <span>Unlock Your Working Capital Today</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
