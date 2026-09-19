"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTenantContext } from "@/context/tenant-context";
import {
  X,
  FileText,
  ArrowRight,
  Compass,
  ShieldCheck,
  QrCode,
  Send,
  Sparkles,
} from "lucide-react";

export function WelcomeModal() {
  const router = useRouter();
  const { currentTenant, updateTenantSettings } = useTenantContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentTenant) return;

    const settings = (currentTenant.settings || {}) as Record<string, any>;
    const hasSeenWelcomeInSettings = Boolean(settings.onboarding_welcome_seen_at);

    // Check fast local cache
    const localSeen =
      typeof window !== "undefined"
        ? localStorage.getItem(`billease_welcome_seen_${currentTenant.id}`)
        : null;

    if (hasSeenWelcomeInSettings || localSeen) {
      setIsOpen(false);
      return;
    }

    // Modal should only appear strictly ONCE in a lifetime for newly registered accounts
    const justRegistered =
      typeof window !== "undefined"
        ? sessionStorage.getItem("billease_just_registered") === "true" ||
          localStorage.getItem("billease_just_registered") === "true"
        : false;

    const tenantCreatedTime = currentTenant.createdAt
      ? new Date(currentTenant.createdAt).getTime()
      : 0;
    const isRecentlyCreated = Date.now() - tenantCreatedTime < 30 * 60 * 1000; // within 30 minutes of creation

    if (justRegistered || isRecentlyCreated) {
      setIsOpen(true);
    }
  }, [currentTenant]);

  const markWelcomeSeen = useCallback(async () => {
    if (!currentTenant) return;

    const timestamp = new Date().toISOString();

    // 1. Immediately cache in localStorage for instant offline & reload blocking
    if (typeof window !== "undefined") {
      localStorage.setItem(`billease_welcome_seen_${currentTenant.id}`, timestamp);
      sessionStorage.removeItem("billease_just_registered");
      localStorage.removeItem("billease_just_registered");
    }

    // 2. Update tenant context in memory immediately
    try {
      updateTenantSettings({
        onboarding_welcome_seen_at: timestamp,
      });
    } catch (e) {
      console.warn("Could not update local tenant settings:", e);
    }

    // 3. Persist permanently to Supabase via backend service-role API (bypassing RLS)
    try {
      await fetch("/api/tenants/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: "dismiss_welcome",
        }),
      });
    } catch (err) {
      console.warn("Failed to persist welcome modal seen state to backend:", err);
    }
  }, [currentTenant, updateTenantSettings]);

  const handleDismiss = useCallback(async () => {
    setIsOpen(false);
    await markWelcomeSeen();
  }, [markWelcomeSeen]);

  const handleCreateInvoice = async () => {
    setIsOpen(false);
    await markWelcomeSeen();
    router.push("/invoices/new");
  };

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  const businessName = currentTenant?.businessName || "Your Business";

  return (
    <div
      onClick={(e) => {
        // Dismiss if clicking directly on backdrop
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Tactile Neo-Claymorphic Card */}
      <div className="clay-card relative w-full max-w-lg p-6 sm:p-8 text-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top-Right Close ("X") Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close welcome modal"
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 cursor-pointer group"
        >
          <X className="h-5 w-5 transition-transform duration-150 group-hover:rotate-90 text-slate-500 hover:text-slate-900" />
        </button>

        {/* Pro Trial Live Pill Badge (Tactile clay tag) */}
        <div className="flex items-center gap-2 mb-4">
          <span className="clay-tag inline-flex items-center gap-2 px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>7-Day Pro Trial Active</span>
          </span>
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
            • Full features unlocked
          </span>
        </div>

        {/* Classic Clean Title */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          Welcome to BillEase,{" "}
          <span className="text-emerald-700 underline decoration-emerald-500/30 decoration-wavy underline-offset-4">
            {businessName}
          </span>{" "}
          👋
        </h2>

        {/* Subtitle */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Your workspace is primed and ready. Create GST-compliant invoices, collect instant UPI payments, and manage client ledgers with zero fuss.
        </p>

        {/* 3 Value Highlight Tiles (Classic Tactile Style) */}
        <div className="my-6 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-xs">
            <div className="clay-icon-squircle h-9 w-9 bg-white border border-slate-200/90 text-emerald-700 flex items-center justify-center shrink-0">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-900 font-bold leading-tight">
                Instant UPI QR
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:block">
                Scan &amp; pay on bill
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-xs">
            <div className="clay-icon-squircle h-9 w-9 bg-white border border-slate-200/90 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-900 font-bold leading-tight">
                GST Compliant
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:block">
                Automated tax bills
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-xs">
            <div className="clay-icon-squircle h-9 w-9 bg-white border border-slate-200/90 text-emerald-700 flex items-center justify-center shrink-0">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-900 font-bold leading-tight">
                WhatsApp Send
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:block">
                1-click direct link
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer order-2 sm:order-1 active:translate-y-[1px]"
          >
            <Compass className="h-4 w-4 text-slate-500" />
            <span>Explore on my own</span>
          </button>

          <button
            type="button"
            onClick={handleCreateInvoice}
            className="clay-btn-emerald px-5 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
          >
            <FileText className="h-4 w-4 text-white" />
            <span>Create your first invoice</span>
            <ArrowRight className="h-4 w-4 text-emerald-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
