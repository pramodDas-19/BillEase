"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV_CONFIG } from "@/config/nav.config";
import { cn } from "@/lib/utils";
import { useLayoutState } from "./dashboard-shell";
import { useTenant } from "@/hooks/use-tenant";
import {
  LayoutDashboard,
  FileText,
  ReceiptText,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  FileText,
  ReceiptText,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, setIsSidebarCollapsed, isMobileNavOpen, setIsMobileNavOpen } =
    useLayoutState();
  const { currentUser, currentTenant } = useTenant();

  const businessName = currentTenant?.businessName || "ABC Events & Prints";
  const userName = currentUser?.name || "Rajesh Sharma";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const renderNavItems = (isMobile: boolean = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {DASHBOARD_NAV_CONFIG.map((section, idx) => (
        <div key={idx} className="space-y-1">
          {section.title && (!isSidebarCollapsed || isMobile) && (
            <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {section.title}
            </h4>
          )}
          <nav className="space-y-1 pt-0.5">
            {section.items.map((item) => {
              const Icon = ICON_MAP[item.iconName] || FileText;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setIsMobileNavOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      isSidebarCollapsed && !isMobile && "justify-center px-0 h-10 w-10 mx-auto"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-700"
                      )}
                    />
                    {(!isSidebarCollapsed || isMobile) && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {item.badge && (!isSidebarCollapsed || isMobile) && (
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Floating Tooltip in Collapsed Desktop Mode */}
                  {isSidebarCollapsed && !isMobile && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:flex items-center gap-1.5 whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 text-[9px]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR                                             */}
      {/* ============================================================ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/80 bg-white lg:flex transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Top Header / ChatGPT-Style Toggle */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-100 transition-all",
            isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {isSidebarCollapsed ? (
            /* Collapsed Single Button with Floating Tooltip (ChatGPT Style) */
            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="clay-icon-squircle flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:flex items-center whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                Open sidebar
              </div>
            </div>
          ) : (
            /* Expanded Mode: Logo + Title + Collapse Button */
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 overflow-hidden"
                title={businessName}
              >
                <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <img
                    src="/assets/logo/LOGO.png"
                    alt="BillEase Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="block truncate text-xs font-bold tracking-tight text-slate-900">
                    {businessName}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400 truncate">
                    Billing Platform
                  </span>
                </div>
              </Link>


              <div className="relative group">
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="clay-icon-squircle rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 hidden rounded-xl bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                  Close sidebar
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Sections */}
        {renderNavItems(false)}

        {/* Bottom User Account Footer (Personalized to User) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={cn(
              "clay-card flex items-center gap-3 p-2 transition-all hover:bg-white border border-slate-200/60 shadow-2xs group relative",
              isSidebarCollapsed && "justify-center p-1.5"
            )}
          >
            <div className="clay-icon-squircle flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
              {userInitials}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] font-semibold text-emerald-700 truncate mt-0.5">
                  Owner & Admin
                </p>
              </div>
            )}

            {/* Collapsed Tooltip for User */}
            {isSidebarCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:flex flex-col whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                <span>{userName}</span>
                <span className="text-[10px] text-emerald-400 font-medium">Owner & Admin</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE DRAWER NAVIGATION                                    */}
      {/* ============================================================ */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl border-r border-slate-200 transition-transform duration-300 ease-out z-50">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <img
                    src="/assets/logo/LOGO.png"
                    alt="BillEase Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">{businessName}</span>
                  <span className="block text-[11px] text-slate-400 font-medium">Billing Platform</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="clay-icon-squircle rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav list */}
            {renderNavItems(true)}

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="clay-card flex items-center gap-3 p-2.5 bg-white border border-slate-200/80 shadow-2xs">
                <div className="clay-icon-squircle flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                  {userInitials}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{userName}</p>
                  <p className="text-[10px] font-semibold text-emerald-700">Owner & Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
