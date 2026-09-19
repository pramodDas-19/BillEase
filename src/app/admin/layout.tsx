"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Users,
  CreditCard,
  History,
  LogOut,
  ExternalLink,
  Activity,
  Menu,
  X,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "tenants";
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (e) {}

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("billease_is_impersonating");
      window.location.href = "/admin";
    }
  };

  const navItems = [
    {
      id: "tenants",
      label: "Tenant Directory",
      href: "/admin?tab=tenants",
      icon: Users,
      description: "Manage registered businesses & trials",
    },
    {
      id: "pricing",
      label: "Pricing & Parameters",
      href: "/admin?tab=pricing",
      icon: CreditCard,
      description: "Trial duration, grace period, Pro fees",
    },
    {
      id: "broadcast",
      label: "Broadcast & Alerts",
      href: "/admin?tab=broadcast",
      icon: Megaphone,
      description: "Push in-app global notifications",
    },
    {
      id: "health",
      label: "System & Health",
      href: "/admin?tab=health",
      icon: Activity,
      description: "Webhook logs & DB connectivity",
    },
    {
      id: "audit",
      label: "Platform Audit Log",
      href: "/admin?tab=audit",
      icon: History,
      description: "Immutable admin action trail",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-950 p-1 border border-slate-800 flex items-center justify-center">
            <Image
              src="/assets/logo/LOGO.png"
              alt="BillEase"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-sm text-white">BillEase Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Standalone Super-Admin Sidebar */}
      <aside
        className={cn(
          "w-full lg:w-72 bg-slate-900 border-r border-slate-800/90 flex flex-col justify-between shrink-0 transition-all z-40",
          isMobileNavOpen ? "block" : "hidden lg:flex"
        )}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-inner flex items-center justify-center">
              <Image
                src="/assets/logo/LOGO.png"
                alt="BillEase Logo"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">BillEase</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 text-[9px] font-black uppercase">
                  SaaS Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Platform Command Center
              </p>
            </div>
          </div>

          {/* Admin Navigation */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Platform Controls
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group",
                    isActive
                      ? "bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-xs"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Jump to Customer Workspace */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Customer Workspace
            </div>
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold">Open Customer App</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom Owner Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 flex items-center justify-center font-black text-xs">
                P
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">Pramod</p>
                <p className="text-[10px] text-purple-400 font-semibold truncate flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Super-Admin
                </p>
              </div>
            </div>

            <button
              onClick={handleAdminLogout}
              title="Lock & Log out of Super-Admin"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 min-w-0 overflow-y-auto max-h-screen p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading SaaS Admin Console...
        </div>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
