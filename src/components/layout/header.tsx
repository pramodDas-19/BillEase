"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { HelpModal } from "@/components/layout/help-modal";
import { useLayoutState } from "./dashboard-shell";


import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Command,
  LayoutGrid,
  Users,
  Package,
  FileText,
  ReceiptText,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { setIsMobileNavOpen } = useLayoutState();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Dynamic route mapping for title and icon
  const getRouteInfo = (path: string) => {
    if (path.startsWith("/clients")) {
      return {
        title: "Clients & Directory",
        Icon: Users,
        badge: null,
      };
    }
    if (path.startsWith("/services")) {
      return {
        title: "Services & Catalog",
        Icon: Package,
        badge: null,
      };
    }
    if (path.startsWith("/quotations")) {
      return {
        title: "Quotations & Estimates",
        Icon: FileText,
        badge: null,
      };
    }
    if (path.startsWith("/invoices")) {
      return {
        title: "Invoices & Billing",
        Icon: ReceiptText,
        badge: null,
      };
    }
    if (path.startsWith("/payments")) {
      return {
        title: "Payments & Receipts",
        Icon: CreditCard,
        badge: null,
      };
    }
    if (path.startsWith("/reports")) {
      return {
        title: "Analytics & Reports",
        Icon: BarChart3,
        badge: null,
      };
    }
    if (path.startsWith("/settings")) {
      return {
        title: "Business Settings",
        Icon: Settings,
        badge: null,
      };
    }
    return {
      title: "Dashboard",
      Icon: LayoutGrid,
      badge: "Live",
    };
  };

  const currentRoute = getRouteInfo(pathname);
  const PageIcon = currentRoute.Icon;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-all">
      {/* Left side: Mobile menu toggle + Dynamic Page Title */}
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
            <PageIcon className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {currentRoute.title}
              </h1>
              {currentRoute.badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentRoute.badge}
                </span>
              )}
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

        {/* Interactive Help & Shortcuts Modal */}
        <HelpModal />

        {/* Interactive Notification Center */}
        <NotificationDropdown />


        <div className="h-6 w-px bg-slate-200/80 mx-0.5 hidden sm:block" />

        {/* User Profile */}
        <UserNav />

      </div>
    </header>
  );
}
