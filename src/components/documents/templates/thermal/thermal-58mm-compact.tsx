import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";

export function Thermal58mmCompactTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="mx-auto w-[210px] max-w-full bg-white text-black p-2 print:p-0 font-mono text-[10px] leading-tight">
      {/* 58mm Store Header */}
      <div className="text-center space-y-0.5">
        <h1 className="text-xs font-bold uppercase tracking-tight">{doc.tenant.businessName}</h1>
        {doc.tenant.phone && <p className="text-[9px]">Ph: {doc.tenant.phone}</p>}
        {doc.tenant.gstin && <p className="text-[8px] font-bold">GST: {doc.tenant.gstin}</p>}
      </div>

      <div className="my-1 border-t border-dashed border-black"></div>

      {/* Bill Meta */}
      <div className="text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span>{isQuotation ? "Quote:" : "Bill:"}</span>
          <span className="font-bold">{doc.documentNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{doc.date}</span>
        </div>
        <div className="flex justify-between">
          <span>To:</span>
          <span className="font-bold truncate max-w-[130px]">{doc.client.name}</span>
        </div>
      </div>

      <div className="my-1 border-t border-dashed border-black"></div>

      {/* Items List (Single condensed row format) */}
      <div className="space-y-1">
        {doc.items.map((item) => (
          <div key={item.id} className="text-[9px]">
            <div className="font-bold leading-tight truncate">{item.name}</div>
            <div className="flex justify-between text-neutral-800 text-[8px]">
              <span>{item.quantity} x {item.rate}</span>
              <span className="font-bold text-[9px] text-black">{formatCurrency(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-1 border-t border-dashed border-black"></div>

      {/* Summary */}
      <div className="space-y-0.5 text-[9px]">
        {doc.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Disc:</span>
            <span>-{formatCurrency(doc.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-xs pt-0.5 border-t border-black">
          <span>TOTAL:</span>
          <span>{formatCurrency(doc.totalAmount)}</span>
        </div>
        {!isQuotation && (
          <div className="flex justify-between font-bold text-[9px]">
            <span>DUE:</span>
            <span>{formatCurrency(doc.balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Compact QR Code */}
      <div className="mt-2 text-center flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.upiQrUrl}
          alt="UPI QR"
          className="w-16 h-16 object-contain border border-black p-0.5"
        />
        <p className="text-[7px] font-mono mt-0.5">
          {doc.tenant.bankDetails.upiId || "business@upi"}
        </p>
      </div>

      <div className="mt-2 pt-1 border-t border-dashed border-neutral-400 text-center text-[8px] text-neutral-600">
        <p>Thank You! Visit Again</p>
      </div>
    </div>
  );
}
