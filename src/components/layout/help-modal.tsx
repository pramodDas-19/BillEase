"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  X,
  Keyboard,
  Workflow,
  Sparkles,
  MessageSquare,
  FileText,
  Receipt,
  Smartphone,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Global Search & Quick Jump" },
    { keys: ["Ctrl", "P"], description: "Print or Export Invoice / Quote as PDF" },
    { keys: ["Esc"], description: "Close any open modal or dropdown" },
  ];

  const workflowSteps = [
    {
      icon: FileText,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      title: "1. Create Quotation",
      desc: "Pick items from your Service Catalog with 1-click auto-complete.",
    },
    {
      icon: Receipt,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      title: "2. 1-Click Convert to Invoice",
      desc: "Turn approved quotations into Tax Invoices with zero re-typing.",
    },
    {
      icon: Smartphone,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      title: "3. Share on WhatsApp with 1-Click Pay",
      desc: "Clients get a direct link to pay via GPay, PhonePe, or Paytm.",
    },
    {
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-600 border-teal-200",
      title: "4. Auto Paid Receipt",
      desc: "Once balance reaches ₹0, invoice automatically seals with PAID stamp.",
    },
  ];

  return (
    <>
      {/* Help Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        title="Help & Quick Guide"
        className="clay-icon-squircle flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs focus:outline-none"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Modal Backdrop & Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="clay-card relative z-10 w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="clay-icon-squircle p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    BillEase Quick Guide & Help
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Shortcuts, features, and billing lifecycle
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="clay-icon-squircle p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5" />
                <span>How Billing Works in BillEase</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${step.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {step.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-7">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Keyboard Shortcuts</span>
              </h4>

              <div className="space-y-1.5">
                {shortcuts.map((sc) => (
                  <div
                    key={sc.description}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-slate-600 font-medium">{sc.description}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono font-extrabold text-slate-700 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct WhatsApp Support Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Need customized features?
              </span>

              <a
                href="https://wa.me/919820145890?text=Hi%20BillEase%20Support,%20I%20have%20a%20question%20regarding%20the%20billing%20software."
                target="_blank"
                rel="noopener noreferrer"
                className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
