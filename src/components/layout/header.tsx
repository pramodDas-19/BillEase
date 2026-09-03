"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { HelpModal } from "@/components/layout/help-modal";
import { HeaderSearch } from "@/components/layout/header-search";
import { useLayoutState } from "./dashboard-shell";

import {
  Menu,
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
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 mr-2">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="clay-icon-squircle p-2 text-slate-600 hover:text-slate-900 lg:hidden focus:outline-none bg-slate-50 border border-slate-200/70 cursor-pointer shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="clay-icon-squircle hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs shrink-0">
            <PageIcon className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">
                {currentRoute.title}
              </h1>
              {currentRoute.badge && (
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentRoute.badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Header Search, Help, Notifications, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Inline Search Bar on Desktop, Compact Icon on Mobile */}
        <HeaderSearch />

        {/* Interactive Help & Shortcuts Modal (Desktop only) */}
        <div className="hidden sm:block">
          <HelpModal />
        </div>

        {/* Interactive Notification Center */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200/80 mx-0.5 hidden sm:block" />

        {/* User Profile */}
        <UserNav />
      </div>

    </header>
  );
}
