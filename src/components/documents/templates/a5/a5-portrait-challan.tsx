import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A5PortraitChallanTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-[10px] p-4 print:p-0 font-sans leading-tight">
      <div className="border border-slate-400 p-3 rounded space-y-2">
        {/* Header */}
        <div className="flex justify-between items-start pb-2 border-b border-slate-300">
          <div>
            <h1 className="text-sm font-black text-slate-900">{doc.tenant.businessName}</h1>
            {doc.tenant.address && <p className="text-[9px] text-slate-600 mt-0.5 leading-tight">{doc.tenant.address}</p>}
            <div className="flex gap-2 text-[8px] text-slate-500 mt-0.5">
              {doc.tenant.phone && <span>Ph: {doc.tenant.phone}</span>}
              {doc.tenant.gstin && <span>GST: <strong>{doc.tenant.gstin}</strong></span>}
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-[9px] uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-300 inline-block">
              {doc.documentTitle}
            </span>
            <p className="font-mono font-bold text-xs mt-1">{doc.documentNumber}</p>
            <p className="text-[9px] text-slate-500">Date: {doc.date}</p>
          </div>
        </div>

        {/* Customer & Delivery */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase block">Customer / Party:</span>
            <p className="font-bold text-slate-900">{doc.client.name}</p>
            {doc.client.phone && <p className="text-slate-600">Ph: {doc.client.phone}</p>}
            {doc.client.gstin && <p className="text-slate-600">GST: {doc.client.gstin}</p>}
          </div>
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase block">Delivery / Ref:</span>
            <p className="text-slate-600 truncate">{doc.shippingAddress || "Counter Sale"}</p>
            {doc.vehicleNo && <p className="text-slate-700">Vehicle: {doc.vehicleNo}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-100 font-bold text-slate-700">
              <th className="py-1 px-1 text-center w-6">#</th>
              <th className="py-1 px-1 text-left">Item</th>
              <th className="py-1 px-1 text-center w-10">Qty</th>
              <th className="py-1 px-1 text-right w-14">Rate</th>
              <th className="py-1 px-1 text-right w-16">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-1 px-1 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-1 px-1 font-bold text-slate-900">
                  {item.name}
                  {item.hsnSacCode && <span className="text-[7px] text-slate-400 ml-1">({item.hsnSacCode})</span>}
                </td>
                <td className="py-1 px-1 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[7px] text-slate-400">{item.unit}</span>
                </td>
                <td className="py-1 px-1 text-right font-mono text-slate-600">{formatCurrency(item.rate)}</td>
                <td className="py-1 px-1 text-right font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-bold bg-slate-50 text-right">
              <td colSpan={2} className="py-1 px-1 text-left">Total</td>
              <td className="py-1 px-1 text-center font-mono">{doc.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td colSpan={2} className="py-1 px-1 font-mono text-slate-900">{formatCurrency(doc.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Summary Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[9px] items-center">
          <div className="space-y-1">
            {doc.tenant.bankDetails.upiId && (
              <div className="flex items-center gap-2">
                <UpiQrBadge doc={doc} size={48} layout="stacked" />
                <div className="text-[8px] text-slate-600">
                  <p className="font-bold">Scan to Pay</p>
                  <p className="font-mono truncate max-w-[90px]">{doc.tenant.bankDetails.upiId}</p>
                </div>
              </div>
            )}
            <p className="text-[8px] text-slate-500 italic capitalize">{doc.totalInWords} Only</p>
          </div>

          <div className="space-y-0.5 text-right font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(doc.subtotal)}</span>
            </div>
            {doc.isTaxEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>GST:</span>
                <span>+{formatCurrency(doc.totalTax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[11px] text-slate-900 pt-0.5 border-t border-slate-300">
              <span>Grand Total:</span>
              <span>{formatCurrency(doc.totalAmount)}</span>
            </div>
            {!isQuotation && (
              <div className="flex justify-between text-slate-700 text-[9px]">
                <span>Balance:</span>
                <span className="font-bold text-amber-900">{formatCurrency(doc.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-between items-end pt-2 border-t border-slate-200">
          <p className="text-[7px] text-slate-400">Computer generated bill</p>
          <SignatureBlock doc={doc} compact />
        </div>
      </div>
    </div>
  );
}
