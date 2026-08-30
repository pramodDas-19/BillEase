"use client";

import React, { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";

export function TenantSwitcher() {
  const { currentTenant, availableTenants, switchTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 focus:outline-none"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-xs">
            {currentTenant?.businessName?.charAt(0) || "B"}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-xs font-semibold text-slate-900">
              {currentTenant?.businessName}
            </p>
            <p className="truncate text-[11px] text-slate-500 capitalize">
              {currentTenant?.businessType?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Business / Account
            </div>
            <div className="space-y-0.5 my-1">
              {availableTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    switchTenant(t.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{t.businessName}</span>
                  </div>
                  {t.id === currentTenant.id && (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  alert("Multi-business onboarding wizard will open here.");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-slate-400" />
                <span>Add new business account</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
