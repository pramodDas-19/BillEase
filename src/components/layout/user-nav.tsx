"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { useTenantContext } from "@/context/tenant-context";
import { Settings, LogOut, Shield, ChevronDown } from "lucide-react";

export function UserNav() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { currentTenant, currentUser } = useTenantContext();

  const handleSignOut = async () => {
    setIsOpen(false);
    await AuthService.signOut();
    router.push("/login");
  };

  const displayName = currentUser?.name || currentTenant?.businessName || "My Account";
  const displayEmail = currentUser?.email || currentTenant?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="clay-icon-squircle flex items-center gap-2 p-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs focus:outline-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-extrabold text-white shadow-xs">
          {initial}
        </div>
        <span className="text-xs font-bold text-slate-800 hidden md:inline-block max-w-[140px] truncate">
          {displayName}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400 mr-1 hidden md:inline-block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="clay-card absolute right-0 mt-2.5 w-64 p-2 z-50 animate-in fade-in-50 zoom-in-95 shadow-xl">
            <div className="px-3 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{displayEmail}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                <Shield className="h-3 w-3" />
                <span className="truncate">{currentTenant.businessName}</span>
              </div>
            </div>


            <div className="py-1.5 space-y-0.5">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Business & UPI Settings</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-1.5 mt-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
