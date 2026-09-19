import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";

export function ThermalGroceryRetailTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";
  const totalItemsCount = doc.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto w-[300px] max-w-full bg-white text-black p-4 print:p-0 font-mono text-xs leading-tight">
      {/* Supermarket Header */}
      <div className="text-center space-y-0.5">
        <h1 className="text-base font-black uppercase tracking-wider">{doc.tenant.businessName}</h1>
        <p className="text-[10px] uppercase font-bold">SUPERMARKET &amp; RETAIL MART</p>
        {doc.tenant.address && <p className="text-[10px] text-neutral-700">{doc.tenant.address}</p>}
        {doc.tenant.phone && <p className="text-[10px]">Customer Care: {doc.tenant.phone}</p>}
        {doc.tenant.gstin && <p className="text-[10px] font-bold">GSTIN: {doc.tenant.gstin}</p>}
      </div>

      <div className="my-2 border-t-2 border-dashed border-black"></div>

      {/* POS Meta */}
      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>POS BILL NO:</span>
          <span className="font-bold">{doc.documentNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE &amp; TIME:</span>
          <span>{doc.date}</span>
        </div>
        <div className="flex justify-between">
          <span>CUSTOMER:</span>
          <span className="font-bold truncate max-w-[170px]">{doc.client.name}</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span>Counter 01</span>
        </div>
      </div>

      <div className="my-2 border-t border-black"></div>

      {/* Items Head */}
      <div className="grid grid-cols-12 text-[10px] font-bold pb-1">
        <span className="col-span-5">ITEM / HSN</span>
        <span className="col-span-2 text-center">QTY</span>
        <span className="col-span-2 text-right">RATE</span>
        <span className="col-span-3 text-right">AMOUNT</span>
      </div>

      <div className="border-t border-black mb-1"></div>

      {/* Items List */}
      <div className="space-y-1.5 py-1 text-[10px]">
        {doc.items.map((item) => (
          <div key={item.id}>
            <div className="font-bold truncate">{item.name}</div>
            <div className="grid grid-cols-12 text-neutral-800">
              <span className="col-span-5 text-[8px] text-neutral-500 font-mono">
                {item.hsnSacCode ? `HSN:${item.hsnSacCode}` : ""}
              </span>
              <span className="col-span-2 text-center font-bold">{item.quantity} {item.unit}</span>
              <span className="col-span-2 text-right">{item.rate}</span>
              <span className="col-span-3 text-right font-bold text-black">{item.amount}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-black"></div>

      {/* Total Qty & Summary */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between font-bold">
          <span>TOTAL PIECES:</span>
          <span>{totalItemsCount}</span>
        </div>
        <div className="flex justify-between text-neutral-700">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(doc.subtotal)}</span>
        </div>
        {doc.discountAmount > 0 && (
          <div className="flex justify-between text-neutral-900">
            <span>DISCOUNT SAVINGS:</span>
            <span>-{formatCurrency(doc.discountAmount)}</span>
          </div>
        )}
        {doc.isTaxEnabled && (
          <div className="flex justify-between text-neutral-700 text-[10px]">
            <span>INCL. GST TAX:</span>
            <span>+{formatCurrency(doc.totalTax)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t-2 border-black">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(doc.totalAmount)}</span>
        </div>
        {!isQuotation && (
          <div className="flex justify-between font-bold text-xs pt-0.5">
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(doc.balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Savings Highlight Banner */}
      {doc.discountAmount > 0 && (
        <div className="my-2.5 p-1.5 bg-black text-white text-center font-bold text-[10px] tracking-wider uppercase">
          ★ YOU SAVED {formatCurrency(doc.discountAmount)} TODAY! ★
        </div>
      )}

      {/* UPI QR Payment */}
      <div className="mt-3 text-center flex flex-col items-center">
        <p className="text-[9px] font-bold uppercase mb-1">SCAN TO PAY VIA UPI</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.upiQrUrl}
          alt="UPI QR"
          className="w-20 h-20 object-contain border border-black p-0.5"
        />
        <p className="text-[8px] font-mono mt-0.5">
          {doc.tenant.bankDetails.upiId || "business@upi"}
        </p>
      </div>

      {/* Simulated Barcode at bottom */}
      <div className="mt-3 pt-2 border-t-2 border-dashed border-black text-center space-y-1">
        <div className="h-7 w-44 mx-auto flex items-stretch justify-center gap-[2px] opacity-80 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block ${
                i % 4 === 0 ? "w-1 bg-black" : i % 3 === 0 ? "w-[2px] bg-black" : "w-[1px] bg-black"
              }`}
            ></span>
          ))}
        </div>
        <p className="text-[9px] font-mono tracking-widest">{doc.documentNumber}</p>
        <p className="text-[8px] text-neutral-600">Exchange within 7 days with original receipt</p>
        <p className="text-[9px] font-bold">THANK YOU FOR VISITING!</p>
      </div>
    </div>
  );
}
