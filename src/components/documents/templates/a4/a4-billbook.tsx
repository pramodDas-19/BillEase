import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A4BillbookTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-xs p-8 print:p-0 font-sans document-print-root avoid-break">
      <div className="border border-slate-400 p-5 rounded">
        {/* Document Subtitle / Badge */}
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          {isQuotation ? "ESTIMATE / QUOTATION" : (doc.isTaxEnabled ? "TAX INVOICE" : "BILL OF SUPPLY")}
        </div>

        {/* Business Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-300">
          <div className="flex items-center gap-3">
            {doc.tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.tenant.logoUrl}
                alt="Logo"
                className="w-14 h-14 object-contain rounded border border-slate-200"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{doc.tenant.businessName}</h1>
              {doc.tenant.address && <p className="text-[11px] text-slate-600 mt-0.5">{doc.tenant.address}</p>}
              <div className="flex gap-3 text-[10px] text-slate-500 mt-0.5">
                {doc.tenant.phone && <span>Mobile: {doc.tenant.phone}</span>}
                {doc.tenant.gstin && <span>GSTIN: {doc.tenant.gstin}</span>}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] space-y-0.5">
            <p className="font-bold font-mono text-sm">{doc.documentNumber}</p>
            <p className="text-slate-600">Date: {doc.date}</p>
            <p className="text-slate-500">{doc.dueDateOrValidUntil.label}: {doc.dueDateOrValidUntil.value}</p>
          </div>
        </div>

        {/* Bill To Party */}
        <div className="py-3 border-b border-slate-300 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">BILL TO</span>
            <p className="font-bold text-slate-900 text-xs">{doc.client.name}</p>
            {doc.client.companyName && <p className="font-semibold text-slate-800 text-[11px]">{doc.client.companyName}</p>}
            {doc.client.address && <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{doc.client.address}</p>}
            {doc.client.phone && <p className="text-[10px] text-slate-600 mt-0.5">Ph: {doc.client.phone}</p>}
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">DELIVERY DETAILS</span>
            <p className="text-[10px] text-slate-600">{doc.shippingAddress || "Same as Billing"}</p>
            {doc.vehicleNo && <p className="text-[10px] text-slate-700 mt-1">Vehicle No: <strong>{doc.vehicleNo}</strong></p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse my-3 text-xs">
          <thead>
            <tr className="border-b-2 border-slate-400 bg-slate-100 text-slate-800 font-bold text-[11px]">
              <th className="py-2 px-2 text-center w-10">S.No.</th>
              <th className="py-2 px-3 text-left">ITEMS</th>
              <th className="py-2 px-2 text-center w-20">QTY.</th>
              <th className="py-2 px-3 text-right w-24">RATE / ITEM</th>
              <th className="py-2 px-3 text-right w-28">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doc.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-2 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                <td className="py-2 px-3">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="py-2 px-2 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[9px] font-normal text-slate-400">{item.unit}</span>
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(item.rate)}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Height filler lines for balanced A4 sheet */}
            {doc.items.length < 5 &&
              Array.from({ length: Math.max(0, 4 - doc.items.length) }).map((_, i) => (
                <tr key={`fill-${i}`} className="h-6 print:h-5">
                  <td className="py-0.5 px-2 text-center text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-2 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-400 font-bold bg-slate-50 text-slate-900">
              <td colSpan={2} className="py-2 px-3 text-right uppercase text-[10px]">
                Total Items: {doc.items.length}
              </td>
              <td className="py-2 px-2 text-center font-mono">
                {doc.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="py-2 px-3 text-right uppercase text-[10px]">Total Amount:</td>
              <td className="py-2 px-3 text-right font-mono text-sm font-black">{formatCurrency(doc.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Totals, Bank, QR & Signature */}
        <div className="pt-3 border-t border-slate-300 avoid-break">
          <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-7 space-y-3">
            <div className="text-[10px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoice Amount (in words)</span>
              <p className="font-bold text-slate-800 capitalize italic">{doc.totalInWords} Only</p>
            </div>

            <div className="flex gap-4 items-center pt-2 border-t border-slate-200">
              <div className="text-[10px] space-y-0.5 flex-1">
                <span className="font-bold uppercase text-[9px] text-slate-500 block">Bank Details</span>
                <p>A/C Name: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
                <p>Account No: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
                <p>IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
              </div>
              <div className="shrink-0">
                <UpiQrBadge doc={doc} size={64} layout="stacked" />
              </div>
            </div>

            {doc.terms && (
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700 block">Terms and Conditions:</span>
                <p className="whitespace-pre-line leading-tight">{doc.terms}</p>
              </div>
            )}
          </div>

          <div className="col-span-5 space-y-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(doc.subtotal)}</span>
              </div>
              {doc.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(doc.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono">{formatCurrency(doc.totalAmount)}</span>
              </div>
              {!isQuotation && (
                <>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Received Amount:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(doc.receivedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold bg-amber-100 p-1 rounded text-xs">
                    <span>Balance Amount:</span>
                    <span className="font-mono">{formatCurrency(doc.balanceDue)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <SignatureBlock doc={doc} compact />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
