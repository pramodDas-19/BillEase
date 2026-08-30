"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import {
  Plus,
  FileText,
  Receipt,
  UserPlus,
  CreditCard,
  ChevronDown,
  Calendar,
  AlertCircle,
} from "lucide-react";

export function DashboardHeader() {
  const { currentUser } = useTenant();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [greeting, setGreeting] = useState("Good day");
  const [dateString, setDateString] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    try {
      const formatted = new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now);
      setDateString(formatted);
    } catch {
      setDateString(now.toDateString());
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsCreateOpen(false);
      }
    };
    if (isCreateOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCreateOpen]);

  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "Rajesh";

  const handleScrollToAttention = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("payment-attention");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "center" });
      elem.classList.add("ring-2", "ring-amber-400", "ring-offset-2");
      setTimeout(() => {
        elem.classList.remove("ring-2", "ring-amber-400", "ring-offset-2");
      }, 1500);
    }
  };

  const createOptions = [
    {
      label: "Quotation / Estimate",
      description: "Quick quote for events or printing",
      href: "/quotations/new",
      icon: FileText,
      iconColor: "text-blue-600 bg-blue-50/90 border border-blue-100",
    },
    {
      label: "Tax Invoice",
      description: "Bill a client or create from quote",
      href: "/invoices/new",
      icon: Receipt,
      iconColor: "text-emerald-600 bg-emerald-50/90 border border-emerald-100",
    },
    {
      label: "New Client",
      description: "Add client contact details",
      href: "/clients/new",
      icon: UserPlus,
      iconColor: "text-indigo-600 bg-indigo-50/90 border border-indigo-100",
    },
    {
      label: "Record Payment",
      description: "Log UPI, bank or cash receipt",
      href: "/invoices",
      icon: CreditCard,
      iconColor: "text-amber-600 bg-amber-50/90 border border-amber-100",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Title + Clean Date & Interactive Action Chip */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {greeting},{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Chip */}
          <div className="clay-tag inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-700 border border-slate-200/80 text-xs font-semibold shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateString || "Sun, 30 Aug 2026"}</span>
          </div>

          {/* Interactive Clickable Action Alert Chip */}
          <button
            onClick={handleScrollToAttention}
            title="Click to jump to Payment Attention"
            className="clay-tag inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 text-xs font-bold shadow-2xs hover:scale-102 active:scale-98 transition-all cursor-pointer group"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse group-hover:scale-110" />
            <span>3 Actions Due Today</span>
            <span className="text-[10px] text-amber-600 font-semibold opacity-70 group-hover:opacity-100">
              →
            </span>
          </button>
        </div>
      </div>

      {/* + Create CTA with tactile Neo-Clay button */}
      <div className="relative shrink-0 self-start lg:self-center" ref={menuRef}>
        <button
          onClick={() => setIsCreateOpen((prev) => !prev)}
          className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20">
            <Plus className="h-3.5 w-3.5 text-emerald-300 stroke-[3]" />
          </div>
          <span>Create</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-300 transition-transform duration-200 ${
              isCreateOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isCreateOpen && (
          <div className="clay-card absolute right-0 mt-2.5 w-72 p-2.5 z-50 animate-in fade-in-50 zoom-in-95 shadow-xl">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <div className="space-y-1.5 my-1">
              {createOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setIsCreateOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className={`clay-icon-container p-2 rounded-xl ${opt.iconColor} shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                        {opt.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
