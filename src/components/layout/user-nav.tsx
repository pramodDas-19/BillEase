"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { useTenantContext } from "@/context/tenant-context";
import { Settings, LogOut, Shield, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";

export function UserNav() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { currentTenant, currentUser } = useTenantContext();

  const handleSignOut = async () => {
    setIsOpen(false);
    await AuthService.signOut();
    router.push("/login");
  };

  const displayName = currentUser?.name || "Pramod Das";
  const displayEmail = currentUser?.email || currentTenant?.email || "billeasesupport@gmail.com";
  const sub = currentTenant?.subscription;
  const isPaid = sub?.status === "active";
  const planLabel = isPaid
    ? sub?.plan === "enterprise"
      ? "Enterprise"
      : "Pro plan"
    : "Free plan";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="clay-icon-squircle flex items-center gap-2 p-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs focus:outline-none min-h-[38px] min-w-[38px]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white shadow-xs">
          {initials}
        </div>
        <div className="text-left hidden md:block max-w-[130px]">
          <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block truncate leading-tight">
            {planLabel}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400 mr-1 hidden md:inline-block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Sleek Reference-2 Popover Menu */}
          <div className="absolute right-0 mt-2.5 w-68 max-w-[calc(100vw-2rem)] p-1.5 z-50 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-2xl animate-in fade-in-50 zoom-in-95">
            {/* Top User Profile Header */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-extrabold text-slate-200">
                  {initials}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {planLabel}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 -rotate-90 group-hover:text-white transition-colors" />
            </Link>

            <div className="h-px bg-slate-800 my-1" />

            {/* Menu Items */}
            <div className="space-y-0.5 text-xs font-semibold">
              {/* Upgrade Plan */}
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="font-bold">Upgrade plan</span>
              </Link>

              {/* Business & UPI Settings */}
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Settings</span>
              </Link>

              {/* Help */}
              <Link
                href="/terms"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Shield className="h-4 w-4 text-slate-400" />
                <span>Terms & Legal</span>
              </Link>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
