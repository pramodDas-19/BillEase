"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Receipt,
  Users,
  Plus,
  X,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomBar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutGrid },
    { href: "/quotations", label: "Quotes", icon: FileText },
    { isAction: true },
    { href: "/invoices", label: "Invoices", icon: Receipt },
    { href: "/clients", label: "Clients", icon: Users },
  ];

  return (
    <>
      {/* Action Popup Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)} />

          <div className="clay-card fixed bottom-20 left-4 right-4 z-50 bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Quick Create
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/invoices/new"
                onClick={() => setIsMenuOpen(false)}
                className="clay-card p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center gap-2.5 hover:bg-emerald-100 transition-colors"
              >
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-xs font-black text-emerald-950">New Invoice</h6>
                  <p className="text-[10px] text-emerald-700 font-medium">Create tax bill</p>
                </div>
              </Link>

              <Link
                href="/quotations/new"
                onClick={() => setIsMenuOpen(false)}
                className="clay-card p-3 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex items-center gap-2.5 hover:bg-blue-100 transition-colors"
              >
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-2xs">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-xs font-black text-blue-950">New Quote</h6>
                  <p className="text-[10px] text-blue-700 font-medium">Price estimate</p>
                </div>
              </Link>

              <Link
                href="/clients/new"
                onClick={() => setIsMenuOpen(false)}
                className="clay-card p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 hover:bg-slate-100 transition-colors"
              >
                <div className="p-2 rounded-xl bg-slate-800 text-white shadow-2xs">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-xs font-black text-slate-900">Add Client</h6>
                  <p className="text-[10px] text-slate-500 font-medium">New contact</p>
                </div>
              </Link>

              <Link
                href="/payments/record"
                onClick={() => setIsMenuOpen(false)}
                className="clay-card p-3 rounded-2xl bg-purple-50/60 border border-purple-200/70 flex items-center gap-2.5 hover:bg-purple-100 transition-colors"
              >
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-2xs">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-xs font-black text-purple-950">Log Payment</h6>
                  <p className="text-[10px] text-purple-700 font-medium">Direct receipt</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 shadow-lg print:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item, idx) => {
            if (item.isAction) {
              return (
                <button
                  key={idx}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="clay-btn-emerald -mt-5 h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer focus:outline-none"
                  aria-label="Create Action"
                >
                  <Plus
                    className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      isMenuOpen && "rotate-45"
                    )}
                  />
                </button>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
                  isActive
                    ? "text-emerald-700 font-black"
                    : "text-slate-400 hover:text-slate-700 font-medium"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
