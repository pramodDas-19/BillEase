"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, Smartphone } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("billease_pwa_prompt_dismissed");
      if (dismissed) return;

      // Detect iOS Safari (Apple doesn't support beforeinstallprompt)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = isIos && userAgent.includes("safari") && !userAgent.includes("crios");

      if (isIos && isSafari) {
        setIsIosDevice(true);
        setTimeout(() => setIsVisible(true), 3500);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay for natural feel
      setTimeout(() => {
        setIsVisible(true);
      }, 2500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("billease_pwa_prompt_dismissed", "true");
    }
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300 mb-safe">
      <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs">
            {isIosDevice ? (
              <Share2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Download className="h-5 w-5 text-emerald-600 animate-bounce" />
            )}
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>{isIosDevice ? "Install on iPhone" : "Install BillEase App"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                APP
              </span>
            </h5>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-tight">
              {isIosDevice
                ? "Tap Share (bottom bar) then 'Add to Home Screen'"
                : "Faster offline access & instant billing"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
          {!isIosDevice && (
            <button
              onClick={handleInstallClick}
              className="clay-btn-emerald px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-95 transition-all app-press"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            title="Dismiss"
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer app-press"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
