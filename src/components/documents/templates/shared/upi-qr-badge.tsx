import React from "react";
import Image from "next/image";
import { NormalizedDocument } from "./template-adapter";

interface UpiQrBadgeProps {
  doc: NormalizedDocument;
  size?: number;
  layout?: "stacked" | "inline";
}

export function UpiQrBadge({ doc, size = 96, layout = "stacked" }: UpiQrBadgeProps) {
  const upiId = doc.tenant.bankDetails.upiId || "business@upi";
  const isDemo = !doc.tenant.bankDetails.upiId;

  return (
    <div
      className={`border border-slate-300 rounded-lg p-2 bg-white flex ${
        layout === "inline" ? "flex-row items-center gap-3" : "flex-col items-center text-center gap-1.5"
      }`}
    >
      <div className="relative bg-white p-1 rounded border border-slate-200" style={{ width: size, height: size }}>
        {/* Render QR code */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.upiQrUrl}
          alt="Scan to Pay via UPI"
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>
      <div className="text-[10px] leading-tight text-slate-700">
        <p className="font-bold text-slate-900 flex items-center justify-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          Scan & Pay with UPI
        </p>
        <p className="font-mono text-[9px] text-slate-500 mt-0.5 max-w-[140px] truncate" title={upiId}>
          {upiId}
        </p>
        <p className="text-[8px] text-slate-400 mt-0.5">GPay / PhonePe / Paytm / BHIM</p>
      </div>
    </div>
  );
}
