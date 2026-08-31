"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Global Search & Quick Jump" },
    { keys: ["Ctrl", "P"], description: "Print or Export Invoice / Quote as PDF" },
    { keys: ["Esc"], description: "Close any modal or menu" },
  ];

  const workflowSteps = [
    {
      icon: FileText,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      title: "1. Quotations",
      desc: "Smart catalog auto-fill & estimates.",
    },
    {
      icon: Receipt,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      title: "2. 1-Click Convert",
      desc: "Turn approved quotes to Tax Invoices.",
    },
    {
      icon: Smartphone,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      title: "3. WhatsApp UPI",
      desc: "Direct 1-click GPay / PhonePe pay portal.",
    },
    {
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-600 border-teal-200",
      title: "4. PAID Seal",
      desc: "Auto-stamps verified PAID receipt.",
    },
  ];

  return (
    <div className="relative">
      {/* Help Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Help & Quick Guide"
        className="clay-icon-squircle relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs focus:outline-none"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="clay-card absolute right-0 mt-2.5 w-80 sm:w-96 p-4 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-2xl animate-in fade-in-50 zoom-in-95 space-y-3.5 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="clay-icon-squircle p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Quick Guide & Help
                </h4>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="clay-icon-squircle p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Billing Lifecycle */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Workflow className="h-3 w-3" />
                <span>How Billing Works</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1 rounded border shrink-0 ${step.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <h5 className="text-[11px] font-bold text-slate-900 truncate">
                          {step.title}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Keyboard className="h-3 w-3" />
                <span>Shortcuts</span>
              </span>

              <div className="space-y-1 text-xs">
                {shortcuts.map((sc) => (
                  <div
                    key={sc.description}
                    className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded-lg hover:bg-slate-50"
                  >
                    <span className="text-slate-600 font-medium truncate">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-700 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct WhatsApp Support */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-medium">Need live assistance?</span>

              <a
                href="https://wa.me/919820145890?text=Hi%20BillEase%20Support,%20I%20have%20a%20question%20regarding%20the%20billing%20software."
                target="_blank"
                rel="noopener noreferrer"
                className="clay-tag inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-3 w-3 text-teal-600" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
