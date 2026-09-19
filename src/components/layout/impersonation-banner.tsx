"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft, Clock } from "lucide-react";
import { useTenantContext } from "@/context/tenant-context";

export function ImpersonationBanner() {
  const { currentTenant } = useTenantContext();
  const [impersonating, setImpersonating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isImp =
        sessionStorage.getItem("billease_is_impersonating") === "true" ||
        localStorage.getItem("billease_is_impersonating") === "true";
      setImpersonating(isImp);

      if (isImp) {
        let expiry = Number(
          sessionStorage.getItem("billease_impersonation_expires") ||
          localStorage.getItem("billease_impersonation_expires")
        );
        if (!expiry || isNaN(expiry)) {
          expiry = Date.now() + 30 * 60 * 1000;
          sessionStorage.setItem("billease_impersonation_expires", expiry.toString());
          localStorage.setItem("billease_impersonation_expires", expiry.toString());
        }

        const updateTimer = () => {
          const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleExit();
          }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  if (!impersonating) return null;

  const handleExit = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("billease_is_impersonating");
      sessionStorage.removeItem("billease_impersonating_tenant_name");
      sessionStorage.removeItem("billease_impersonation_expires");
      sessionStorage.removeItem("billease_active_tenant_id");
      localStorage.removeItem("billease_is_impersonating");
      localStorage.removeItem("billease_impersonating_tenant_name");
      localStorage.removeItem("billease_impersonation_expires");
      localStorage.removeItem("billease_active_tenant_id");
      window.location.href = "/admin";
    }
  };

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 30;
  const seconds = timeLeft !== null ? (timeLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-amber-500/60 print:hidden sticky top-0 z-50 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-950/10 border border-amber-950/20 text-amber-950">
          <ShieldAlert className="h-4 w-4 shrink-0" />
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="tracking-tight">
            Support Impersonation Mode: You are viewing workspace as{" "}
            <strong className="underline underline-offset-2">{currentTenant?.businessName || "Tenant"}</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/10 text-amber-950 text-[10px] font-extrabold border border-amber-950/15">
            <Clock className="h-3 w-3" />
            <span>{minutes}:{seconds} remaining</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block text-[11px] text-amber-900 font-semibold">
          (Audit log active)
        </span>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit to Admin Panel</span>
        </button>
      </div>
    </div>
  );
}
