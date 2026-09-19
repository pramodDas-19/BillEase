import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";

export function Thermal80mmStandardTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="mx-auto w-[300px] max-w-full bg-white text-black p-4 print:p-0 font-mono text-xs leading-relaxed">
      {/* Centered Store Header */}
      <div className="text-center space-y-1">
        <h1 className="text-sm font-bold uppercase tracking-wider">{doc.tenant.businessName}</h1>
        {doc.tenant.address && <p className="text-[11px] text-neutral-800">{doc.tenant.address}</p>}
        {doc.tenant.phone && <p className="text-[11px]">Mobile: {doc.tenant.phone}</p>}
        {doc.tenant.gstin && <p className="text-[11px]">GSTIN: {doc.tenant.gstin}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Bill Meta */}
      <div className="text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>{isQuotation ? "Quote No:" : "Invoice No:"}</span>
          <span className="font-bold">{doc.documentNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{doc.date}</span>
        </div>
        <div className="flex justify-between">
          <span>Bill To:</span>
          <span className="font-bold truncate max-w-[170px]">{doc.client.name}</span>
        </div>
        {doc.client.phone && (
          <div className="flex justify-between text-[10px] text-neutral-700">
            <span>Customer Ph:</span>
            <span>{doc.client.phone}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 text-[11px] font-bold pb-1">
        <span className="col-span-5">Item</span>
        <span className="col-span-2 text-center">Qty</span>
        <span className="col-span-2 text-right">Rate</span>
        <span className="col-span-3 text-right">Amount</span>
      </div>

      <div className="border-t border-dashed border-black my-1"></div>

      {/* Items List */}
      <div className="space-y-1.5 py-1 text-[11px]">
        {doc.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 items-baseline">
            <span className="col-span-5 font-semibold break-words leading-tight">{item.name}</span>
            <span className="col-span-2 text-center font-bold">
              {item.quantity}
            </span>
            <span className="col-span-2 text-right">{item.rate}</span>
            <span className="col-span-3 text-right font-bold">{item.amount}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      {/* Summary / Charges / Discount */}
      <div className="space-y-1 text-[11px]">
        {doc.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(doc.discountAmount)}</span>
          </div>
        )}

        {doc.isTaxEnabled && (
          <div className="flex justify-between text-[10px]">
            <span>GST Amount:</span>
            <span>+{formatCurrency(doc.totalTax)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-1"></div>

        <div className="flex justify-between font-bold text-sm pt-0.5">
          <span>Total:</span>
          <span>{formatCurrency(doc.totalAmount)}</span>
        </div>

        {!isQuotation && (
          <>
            <div className="flex justify-between text-[11px]">
              <span>Amount Paid:</span>
              <span>{formatCurrency(doc.receivedAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-[11px]">
              <span>Balance Amount:</span>
              <span>{formatCurrency(doc.balanceDue)}</span>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      {/* Terms & Return Policy */}
      <div className="text-center text-[10px] space-y-1">
        <p className="font-bold">Terms and Conditions</p>
        <p className="text-neutral-700">
          {doc.terms || "Shipped items will be taken back only within a week."}
        </p>
        <p className="font-bold text-[11px] pt-1">*** THANK YOU ***</p>
      </div>
    </div>
  );
}
