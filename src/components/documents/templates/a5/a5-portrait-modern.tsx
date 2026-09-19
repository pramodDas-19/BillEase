import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A5PortraitModernTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-800 text-[10px] p-4 print:p-0 font-sans leading-tight">
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
          <div className="flex gap-2.5 items-center">
            {doc.tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.tenant.logoUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-lg border border-slate-200"
              />
            )}
            <div>
              <h1 className="text-sm font-black text-slate-900">{doc.tenant.businessName}</h1>
              {doc.tenant.email && <p className="text-[8px] text-slate-500">{doc.tenant.email}</p>}
              {doc.tenant.phone && <p className="text-[8px] text-slate-500">Ph: {doc.tenant.phone}</p>}
              {doc.tenant.gstin && <p className="text-[8px] font-bold text-indigo-700">GSTIN: {doc.tenant.gstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {doc.documentTitle}
            </span>
            <p className="font-mono font-bold text-xs mt-1 text-slate-900">{doc.documentNumber}</p>
            <p className="text-[8px] text-slate-400">{doc.date}</p>
          </div>
        </div>

        {/* Client details card */}
        <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-[9px]">
          <div>
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block">BILLED TO</span>
            <p className="font-bold text-slate-900">{doc.client.name}</p>
            {doc.client.companyName && <p className="text-slate-600">{doc.client.companyName}</p>}
            {doc.client.phone && <p className="text-slate-500">{doc.client.phone}</p>}
          </div>
          <div className="text-right text-[8px] text-slate-500">
            <p>{doc.dueDateOrValidUntil.label}:</p>
            <p className="font-bold text-slate-800">{doc.dueDateOrValidUntil.value}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-1.5 px-2">ITEM</th>
                <th className="py-1.5 px-2 text-center w-12">QTY</th>
                <th className="py-1.5 px-2 text-right w-16">RATE</th>
                <th className="py-1.5 px-2 text-right w-16">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doc.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.description && (
                      <p className="text-[8px] text-slate-400 leading-tight">{item.description}</p>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-500">{formatCurrency(item.rate)}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial summary */}
        <div className="bg-white p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 items-center text-[9px]">
          <div>
            <UpiQrBadge doc={doc} size={48} layout="inline" />
          </div>
          <div className="space-y-0.5 text-right font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(doc.subtotal)}</span>
            </div>
            {doc.isTaxEnabled && (
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span>+{formatCurrency(doc.totalTax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-100">
              <span>Total:</span>
              <span className="text-indigo-600">{formatCurrency(doc.totalAmount)}</span>
            </div>
            {!isQuotation && (
              <div className="flex justify-between text-slate-700">
                <span>Due:</span>
                <span className="font-bold text-indigo-900">{formatCurrency(doc.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <SignatureBlock doc={doc} compact />
        </div>
      </div>
    </div>
  );
}
