"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { User, Settings, LogOut, Shield, ChevronDown } from "lucide-react";

export function UserNav() {
  const { currentUser, currentTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="clay-icon-squircle flex items-center gap-2 p-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs focus:outline-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-extrabold text-white shadow-xs">
          {currentUser?.name?.charAt(0) || "R"}
        </div>
        <span className="text-xs font-bold text-slate-800 hidden md:inline-block max-w-[100px] truncate">
          {currentUser?.name || "Rajesh S."}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400 mr-1 hidden md:inline-block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="clay-card absolute right-0 mt-2.5 w-60 p-2 z-50 animate-in fade-in-50 zoom-in-95 shadow-xl">
            <div className="px-3 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                <Shield className="h-3 w-3" />
                <span className="capitalize">{currentUser?.role} Account</span>
              </div>
            </div>

            <div className="py-1.5 space-y-0.5">
              <Link
                href="/settings/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Account Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Business Settings</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-1.5 mt-1">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
