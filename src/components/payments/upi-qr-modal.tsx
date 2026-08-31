"use client";

import React, { useState } from "react";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";
import { QrCode, X, Copy, CheckCircle2, Smartphone, ExternalLink, ShieldCheck } from "lucide-react";

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  balanceDue: number;
  businessName?: string;
  upiId?: string;
}

export function UpiQrModal({
  isOpen,
  onClose,
  invoiceNumber,
  clientName,
  balanceDue,
  businessName = "Royal Events & Studio",
  upiId = "royalevents@hdfcbank",
}: UpiQrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upiIntentUrl = generateUpiIntentUrl({
    upiId,
    businessName,
    amount: balanceDue,
    transactionRef: invoiceNumber,
    note: `Invoice ${invoiceNumber}`,
  });

  const qrImageUrl = getUpiQrImageUrl(upiIntentUrl, 360);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="clay-card relative w-full max-w-sm p-6 z-10 bg-white border border-slate-200/80 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="clay-icon-squircle absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200/70 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Smartphone className="h-3 w-3" />
            <span>Instant 0% Fee UPI Settlement</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Scan & Pay via UPI
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Invoice #{invoiceNumber} • {clientName}
          </p>
        </div>

        {/* High-Res QR Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-teal-200 rounded-2xl">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
            <img
              src={qrImageUrl}
              alt={`UPI QR for ${invoiceNumber}`}
              className="h-48 w-48 object-contain"
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Scan using:</span>
            <span className="font-extrabold text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              GPay • PhonePe • Paytm • BHIM
            </span>
          </div>
        </div>

        {/* Amount & Copy UPI ID */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Exact Amount:
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {formatCurrency(balanceDue, "INR")}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-xs">
            <span className="font-mono text-slate-700 text-[11px] truncate">{upiId}</span>
            <button
              onClick={handleCopyUpi}
              className="flex items-center gap-1 font-bold text-[11px] text-emerald-700 hover:text-emerald-800 cursor-pointer shrink-0 ml-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-emerald-600" />
                  <span>Copy VPA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Direct Bank-to-Bank Encrypted Settlement</span>
        </div>
      </div>
    </div>
  );
}
