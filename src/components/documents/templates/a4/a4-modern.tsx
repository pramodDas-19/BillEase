import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A4ModernTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-800 text-xs p-8 print:p-0 font-sans document-print-root avoid-break">
      {/* 1. Modern Header */}
      <div className="flex justify-between items-start pb-6 border-b border-slate-100">
        <div className="flex gap-4 items-center">
          {doc.tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.tenant.logoUrl}
              alt="Logo"
              className="w-14 h-14 object-contain rounded-xl border border-slate-200"
            />
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{doc.tenant.businessName}</h1>
            {doc.tenant.address && <p className="text-[11px] text-slate-500 mt-0.5">{doc.tenant.address}</p>}
            <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 mt-1">
              {doc.tenant.phone && <span>Tel: {doc.tenant.phone}</span>}
              {doc.tenant.email && <span>Email: {doc.tenant.email}</span>}
            </div>
            {doc.tenant.gstin && (
              <p className="text-[10px] font-bold text-indigo-700 mt-0.5">GSTIN: {doc.tenant.gstin}</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
            {doc.documentTitle}
          </span>
          <p className="text-sm font-mono font-bold text-slate-800 mt-1.5">{doc.documentNumber}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Date: {doc.date}</p>
          <p className="text-[10px] text-slate-400">
            {doc.dueDateOrValidUntil.label}: {doc.dueDateOrValidUntil.value}
          </p>
        </div>
      </div>

      {/* 2. Bill To & Ship To Cards with Pill Badges */}
      <div className="grid grid-cols-2 gap-6 my-6">
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white mb-2">
            BILL TO
          </span>
          <h3 className="text-sm font-bold text-slate-900">{doc.client.name}</h3>
          {doc.client.companyName && (
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{doc.client.companyName}</p>
          )}
          {doc.client.address && (
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{doc.client.address}</p>
          )}
          <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-600 mt-2">
            {doc.client.phone && <span>Ph: {doc.client.phone}</span>}
            {doc.client.gstin && <span className="font-semibold text-slate-800">GST: {doc.client.gstin}</span>}
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 mb-2">
            SHIP TO
          </span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {doc.shippingAddress || doc.client.address || "Same as Billing Address"}
          </p>
          {doc.placeOfSupply && (
            <p className="text-[10px] font-medium text-slate-500 mt-2">
              Place of Supply: <strong className="text-slate-700">{doc.placeOfSupply}</strong>
            </p>
          )}
        </div>
      </div>

      {/* 3. Modern Items Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">ITEM DESCRIPTION</th>
              {doc.hasHsn && <th className="py-3 px-3 text-center w-20">HSN/SAC</th>}
              <th className="py-3 px-3 text-center w-20">QTY</th>
              <th className="py-3 px-4 text-right w-28">RATE</th>
              {doc.isTaxEnabled && <th className="py-3 px-3 text-center w-20">TAX</th>}
              <th className="py-3 px-4 text-right w-32">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </td>
                {doc.hasHsn && (
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-600">
                    {item.hsnSacCode || "-"}
                  </td>
                )}
                <td className="py-3 px-3 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">{formatCurrency(item.rate)}</td>
                {doc.isTaxEnabled && (
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-600">
                    {item.taxRate !== undefined ? `${item.taxRate}%` : "-"}
                  </td>
                )}
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {/* Height filler lines for balanced A4 sheet */}
            {doc.items.length < 5 &&
              Array.from({ length: Math.max(0, 4 - doc.items.length) }).map((_, i) => (
                <tr key={`fill-${i}`} className="h-6 print:h-5">
                  <td className="py-0.5 px-4 text-center text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-4 text-transparent select-none">&nbsp;</td>
                  {doc.hasHsn && <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>}
                  <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 px-4 text-transparent select-none">&nbsp;</td>
                  {doc.isTaxEnabled && <td className="py-0.5 px-3 text-transparent select-none">&nbsp;</td>}
                  <td className="py-0.5 px-4 text-transparent select-none">&nbsp;</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Grid: Bank, Notes & Totals */}
      <div className="pt-6 avoid-break">
        <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left (7 Cols): Bank Details, QR & Notes */}
        <div className="col-span-7 space-y-4">
          <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex-1 space-y-1 text-[11px]">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                BANK DETAILS
              </span>
              <p>A/C Holder: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
              <p>Bank: <strong>{doc.tenant.bankDetails.bankName || "-"}</strong></p>
              <p>Account No: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
              <p>IFSC Code: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
              {doc.tenant.bankDetails.upiId && (
                <p className="text-indigo-600 font-bold">UPI: {doc.tenant.bankDetails.upiId}</p>
              )}
            </div>
            <div className="shrink-0">
              <UpiQrBadge doc={doc} size={76} layout="stacked" />
            </div>
          </div>

          {doc.notes && (
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Notes</span>
              <p className="text-[11px] text-slate-600 mt-0.5">{doc.notes}</p>
            </div>
          )}

          {doc.terms && (
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Terms</span>
              <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed mt-0.5">{doc.terms}</p>
            </div>
          )}
        </div>

        {/* Right (5 Cols): Calculation & Signature */}
        <div className="col-span-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(doc.subtotal)}</span>
            </div>
            {doc.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(doc.discountAmount)}</span>
              </div>
            )}
            {doc.isTaxEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST):</span>
                <span className="font-mono">+{formatCurrency(doc.totalTax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span className="font-mono text-indigo-700">{formatCurrency(doc.totalAmount)}</span>
            </div>

            {!isQuotation && (
              <>
                <div className="flex justify-between text-emerald-700 pt-1 text-[11px]">
                  <span>Paid:</span>
                  <span className="font-mono font-bold">{formatCurrency(doc.receivedAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold bg-indigo-50/80 px-2 py-1 rounded-lg text-xs">
                  <span>Balance Due:</span>
                  <span className="font-mono text-indigo-900">{formatCurrency(doc.balanceDue)}</span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 italic">
              {doc.totalInWords} Only
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <SignatureBlock doc={doc} compact />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
