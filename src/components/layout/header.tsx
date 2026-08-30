"use client";

import React, { useState } from "react";
import { UserNav } from "@/components/layout/user-nav";
import { useLayoutState } from "./dashboard-shell";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Command,
  LayoutGrid,
} from "lucide-react";

export function Header() {
  const { setIsMobileNavOpen } = useLayoutState();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-all">
      {/* Left side: Mobile menu toggle + Modern contextual title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="clay-icon-squircle p-2 text-slate-600 hover:text-slate-900 lg:hidden focus:outline-none bg-slate-50 border border-slate-200/70 cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="clay-icon-squircle hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <LayoutGrid className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Tactile Search, Help, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tactile Search Bar */}
        <div className="relative">
          <div
            className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-1.5 transition-all duration-200 cursor-text ${
              isSearchFocused
                ? "border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20 w-60 sm:w-80"
                : "border-slate-200/90 bg-slate-50/80 hover:bg-white hover:border-slate-300 w-44 sm:w-64 shadow-2xs"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search or jump to..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-slate-200/90 bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500 shadow-2xs shrink-0">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Help Button with Tactile Squircle */}
        <button
          title="Help & documentation"
          className="clay-icon-squircle flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Notifications Button with Tactile Squircle & Pill Alert */}
        <button
          title="Notifications"
          className="clay-icon-squircle relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200/80 mx-0.5 hidden sm:block" />

        {/* User Profile */}
        <UserNav />
      </div>
    </header>
  );
}
