import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";

export function ThermalBoutiqueCafeTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="mx-auto w-[290px] max-w-full bg-white text-slate-900 p-4 print:p-0 font-sans text-xs leading-normal">
      {/* Aesthetic Boutique Header */}
      <div className="text-center space-y-1">
        {doc.tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.tenant.logoUrl}
            alt="Logo"
            className="w-12 h-12 object-contain mx-auto rounded-full border border-slate-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-sm mx-auto font-bold">
            ✦
          </div>
        )}
        <h1 className="text-base font-serif font-black tracking-tight">{doc.tenant.businessName}</h1>
        {doc.tenant.address && <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto">{doc.tenant.address}</p>}
        {doc.tenant.phone && <p className="text-[10px] text-slate-500">Ph: {doc.tenant.phone}</p>}
        {doc.tenant.gstin && <p className="text-[9px] text-slate-400 font-mono">GSTIN: {doc.tenant.gstin}</p>}
      </div>

      <div className="my-3 border-t border-slate-200"></div>

      {/* Meta Ribbon */}
      <div className="flex justify-between items-center text-[10px] text-slate-500">
        <div>
          <p className="font-mono font-bold text-slate-900">{doc.documentNumber}</p>
          <p className="text-[9px]">{doc.date}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-slate-800">{doc.client.name}</p>
          <span className="text-[8px] uppercase tracking-wider text-slate-400">{doc.documentTitle}</span>
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-slate-200"></div>

      {/* Line Items */}
      <div className="space-y-2 py-1 text-[11px]">
        {doc.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1 pr-2">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-[9px] text-slate-400">{item.quantity} {item.unit} × {formatCurrency(item.rate)}</p>
            </div>
            <p className="font-bold font-mono text-slate-900">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-slate-200"></div>

      {/* Totals */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="font-mono">{formatCurrency(doc.subtotal)}</span>
        </div>
        {doc.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Special Offer</span>
            <span className="font-mono">-{formatCurrency(doc.discountAmount)}</span>
          </div>
        )}
        {doc.isTaxEnabled && (
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>Taxes &amp; GST</span>
            <span className="font-mono">+{formatCurrency(doc.totalTax)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
          <span>Total</span>
          <span className="font-mono">{formatCurrency(doc.totalAmount)}</span>
        </div>
        {!isQuotation && (
          <div className="flex justify-between text-slate-700 font-bold text-xs pt-0.5">
            <span>Due</span>
            <span className="font-mono">{formatCurrency(doc.balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Scan to Pay */}
      <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col items-center">
        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">Instant UPI Scan &amp; Pay</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.upiQrUrl}
          alt="UPI QR"
          className="w-20 h-20 object-contain rounded border border-slate-200 p-1 bg-white"
        />
        <p className="font-mono text-[9px] text-slate-500 mt-1">
          {doc.tenant.bankDetails.upiId || "business@upi"}
        </p>
      </div>

      {/* Boutique Message */}
      <div className="mt-4 pt-2 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-500">
        <p className="italic font-serif text-slate-700">“Thank you for shopping with us today!”</p>
        <p className="text-[9px] text-slate-400">Please visit us again • Tag us @yourstore</p>
      </div>
    </div>
  );
}
