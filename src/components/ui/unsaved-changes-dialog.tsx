"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirmLeave: () => void;
  onCancel: () => void;
  documentType?: string; // e.g. "quotation" or "invoice"
}

export function UnsavedChangesDialog({
  isOpen,
  onConfirmLeave,
  onCancel,
  documentType = "document",
}: UnsavedChangesDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-desc"
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              Warning
            </span>
            <h3
              id="unsaved-changes-title"
              className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight mt-0.5"
            >
              Unsaved Changes
            </h3>
          </div>
        </div>

        {/* Message */}
        <p id="unsaved-changes-desc" className="text-sm text-slate-600 leading-relaxed mb-6">
          You have unsaved changes in this <strong className="text-slate-800">{documentType}</strong>. If you leave this page now, any entered details, line items, or client info will be lost.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onConfirmLeave}
            className="w-full sm:w-auto font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl py-2.5 px-4 text-xs sm:text-sm cursor-pointer"
          >
            Discard & Leave
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-5 text-xs sm:text-sm shadow-sm cursor-pointer"
            autoFocus
          >
            Stay & Keep Editing
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
