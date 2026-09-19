import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";

export function Thermal80mmGstQrTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="mx-auto w-[300px] max-w-full bg-white text-black p-4 print:p-0 font-mono text-xs leading-tight">
      {/* Header */}
      <div className="text-center space-y-0.5">
        <h1 className="text-sm font-black uppercase tracking-wider">{doc.tenant.businessName}</h1>
        {doc.tenant.address && <p className="text-[10px] text-neutral-700">{doc.tenant.address}</p>}
        <div className="text-[10px] pt-0.5">
          {doc.tenant.gstin && <p className="font-bold">GSTIN: {doc.tenant.gstin}</p>}
          {doc.tenant.phone && <p>Ph: {doc.tenant.phone}</p>}
        </div>
        <div className="inline-block mt-1 px-2 py-0.5 bg-black text-white font-bold text-[9px] uppercase tracking-wider">
          {doc.documentTitle}
        </div>
      </div>

      <div className="my-2 border-t-2 border-black"></div>

      {/* Info Row */}
      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No: <strong className="font-mono text-[11px]">{doc.documentNumber}</strong></span>
          <span>Date: {doc.date}</span>
        </div>
        <div className="flex justify-between text-neutral-800">
          <span>Customer: <strong>{doc.client.name}</strong></span>
          {doc.client.phone && <span>Ph: {doc.client.phone}</span>}
        </div>
      </div>

      <div className="my-1.5 border-t border-dashed border-neutral-400"></div>

      {/* Items Table */}
      <div className="text-[10px]">
        <div className="flex justify-between font-bold border-b border-black pb-1">
          <span className="w-1/2">Item Description</span>
          <span className="w-12 text-center">Qty</span>
          <span className="w-12 text-right">Rate</span>
          <span className="w-14 text-right">Total</span>
        </div>
        <div className="divide-y divide-dashed divide-neutral-200 py-1">
          {doc.items.map((item) => (
            <div key={item.id} className="py-1 flex justify-between items-baseline">
              <div className="w-1/2 pr-1">
                <p className="font-bold">{item.name}</p>
                {item.hsnSacCode && <span className="text-[8px] text-neutral-500">HSN: {item.hsnSacCode}</span>}
              </div>
              <span className="w-12 text-center font-bold">{item.quantity}</span>
              <span className="w-12 text-right">{item.rate}</span>
              <span className="w-14 text-right font-bold">{item.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="my-1 border-t-2 border-black"></div>

      {/* Totals & Tax Summary */}
      <div className="text-[11px] space-y-1">
        <div className="flex justify-between text-neutral-700">
          <span>Taxable Value:</span>
          <span>{formatCurrency(doc.subtotal - doc.discountAmount)}</span>
        </div>
        {doc.isTaxEnabled && (
          <div className="flex justify-between text-neutral-700">
            <span>GST Amount:</span>
            <span>+{formatCurrency(doc.totalTax)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
          <span>TOTAL PAYABLE:</span>
          <span>{formatCurrency(doc.totalAmount)}</span>
        </div>
        {!isQuotation && (
          <div className="flex justify-between font-bold text-[11px]">
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(doc.balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Countertop Dynamic UPI QR Code */}
      <div className="mt-3 pt-2 border-t border-dashed border-black text-center flex flex-col items-center">
        <p className="font-bold text-[10px] uppercase tracking-wider mb-1">
          ⚡ Scan &amp; Pay Instant with UPI
        </p>
        <div className="bg-white p-1.5 border border-black rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.upiQrUrl}
            alt="UPI QR"
            className="w-24 h-24 object-contain"
          />
        </div>
        <p className="font-mono text-[9px] font-bold mt-1">
          {doc.tenant.bankDetails.upiId || "business@upi"}
        </p>
        <p className="text-[8px] text-neutral-600">UPI / GPay / PhonePe / Paytm accepted</p>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-neutral-300 text-center text-[9px] text-neutral-600 space-y-0.5">
        <p>{doc.terms || "Goods once sold cannot be taken back."}</p>
        <p className="font-bold">Visit Again! Have a great day!</p>
      </div>
    </div>
  );
}
