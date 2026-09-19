import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A5LandscapeGstTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-[10px] p-4 print:p-0 font-sans leading-tight">
      <div className="border border-slate-900">
        {/* Top Tag */}
        <div className="text-[8px] font-bold text-slate-600 px-2 pt-1 uppercase">
          {doc.documentTitle}
        </div>

        {/* 1. Header (Business left, Invoice meta right) */}
        <div className="grid grid-cols-12 divide-x border-b border-slate-900 divide-slate-900">
          <div className="col-span-7 p-2 flex gap-2 items-center">
            {doc.tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.tenant.logoUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded border border-slate-200"
              />
            )}
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">{doc.tenant.businessName}</h1>
              {doc.tenant.address && <p className="text-[9px] text-slate-600 mt-0.5">{doc.tenant.address}</p>}
              <div className="flex gap-2 text-[8px] text-slate-600 mt-0.5">
                {doc.tenant.gstin && <span>GSTIN: <strong className="text-slate-800">{doc.tenant.gstin}</strong></span>}
                {doc.tenant.phone && <span>Mobile: {doc.tenant.phone}</span>}
              </div>
            </div>
          </div>

          <div className="col-span-5 grid grid-cols-3 divide-x divide-slate-900 p-1 text-[9px] text-center items-center">
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">
                {isQuotation ? "Quote No." : "Invoice No."}
              </span>
              <span className="font-bold font-mono text-[10px]">{doc.documentNumber}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">Date</span>
              <span className="font-bold">{doc.date}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">{doc.dueDateOrValidUntil.label}</span>
              <span className="font-bold">{doc.dueDateOrValidUntil.value}</span>
            </div>
          </div>
        </div>

        {/* 2. Bill To & Ship To Banner */}
        <div className={doc.shippingAddress ? "grid grid-cols-2 divide-x border-b border-slate-900 bg-white text-[9px]" : "grid grid-cols-1 border-b border-slate-900 bg-white text-[9px]"}>
          <div className="p-1.5 space-y-0.5">
            <span className="text-[8px] font-bold uppercase text-slate-500 block">BILL TO</span>
            <p className="font-bold text-slate-900">{doc.client.name}</p>
            {doc.client.companyName && <p className="font-semibold text-slate-800">{doc.client.companyName}</p>}
            <p className="text-slate-600 leading-tight">{doc.client.address}</p>
            <div className="flex gap-2 text-[8px] text-slate-500">
              {doc.client.phone && <span>Ph: {doc.client.phone}</span>}
              {doc.client.gstin && <span className="font-bold text-slate-800">GST: {doc.client.gstin}</span>}
            </div>
            {doc.placeOfSupply && !doc.shippingAddress && <p className="text-[8px] text-slate-500">Place of Supply: {doc.placeOfSupply}</p>}
          </div>
          {doc.shippingAddress && (
            <div className="p-1.5 space-y-0.5">
              <span className="text-[8px] font-bold uppercase text-slate-500 block">SHIP TO</span>
              <p className="text-slate-600 leading-tight">
                {doc.shippingAddress}
              </p>
              {doc.placeOfSupply && <p className="text-[8px] text-slate-500">Place of Supply: {doc.placeOfSupply}</p>}
            </div>
          )}
        </div>

        {/* 3. Items Table (Landscape Compact) */}
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="bg-amber-100/70 border-b border-slate-900 font-bold text-slate-800 text-center">
              <th className="border-r border-slate-900 p-1 w-7">S.No.</th>
              <th className="border-r border-slate-900 p-1 text-left">ITEMS</th>
              {doc.hasHsn && <th className="border-r border-slate-900 p-1 w-14">HSN</th>}
              <th className="border-r border-slate-900 p-1 w-12">QTY.</th>
              <th className="border-r border-slate-900 p-1 text-right w-16">RATE</th>
              {doc.isTaxEnabled && (
                <th className="border-r border-slate-900 p-1 text-center w-14">GST %</th>
              )}
              <th className="p-1 text-right w-20">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {doc.items.map((item, idx) => (
              <tr key={item.id} className="min-h-[22px]">
                <td className="border-r border-slate-900 p-1 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="border-r border-slate-900 p-1 font-bold text-slate-900">
                  {item.name}
                  {item.description && (
                    <span className="block text-[8px] font-normal text-slate-500 mt-0.5">{item.description}</span>
                  )}
                </td>
                {doc.hasHsn && (
                  <td className="border-r border-slate-900 p-1 text-center font-mono text-[8px]">{item.hsnSacCode || "-"}</td>
                )}
                <td className="border-r border-slate-900 p-1 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[7px] text-slate-400">{item.unit}</span>
                </td>
                <td className="border-r border-slate-900 p-1 text-right font-mono">{formatCurrency(item.rate)}</td>
                {doc.isTaxEnabled && (
                  <td className="border-r border-slate-900 p-1 text-center font-mono text-[8px]">
                    {item.taxRate !== undefined ? `${item.taxRate}%` : "-"}
                  </td>
                )}
                <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-b border-slate-900 font-bold bg-amber-50 text-right">
              <td colSpan={doc.hasHsn ? 3 : 2} className="border-r border-slate-900 p-1 text-center">
                TOTAL AMOUNT
              </td>
              <td className="border-r border-slate-900 p-1 text-center font-mono">
                {doc.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="border-r border-slate-900 p-1"></td>
              {doc.isTaxEnabled && (
                <td className="border-r border-slate-900 p-1 text-center font-mono text-[8px]">
                  {formatCurrency(doc.totalTax)}
                </td>
              )}
              <td className="p-1 font-mono font-black text-slate-900">{formatCurrency(doc.totalAmount)}</td>
            </tr>
            {!isQuotation && (
              <>
                <tr className="border-b border-slate-200 text-right text-slate-600">
                  <td colSpan={doc.hasHsn ? 6 : 5} className="p-0.5 border-r border-slate-900 pr-2">RECEIVED AMOUNT:</td>
                  <td className="p-0.5 font-mono font-bold text-emerald-700">{formatCurrency(doc.receivedAmount)}</td>
                </tr>
                <tr className="border-b border-slate-900 text-right font-bold text-slate-900 bg-amber-100/60">
                  <td colSpan={doc.hasHsn ? 6 : 5} className="p-0.5 border-r border-slate-900 pr-2">BALANCE AMOUNT:</td>
                  <td className="p-0.5 font-mono">{formatCurrency(doc.balanceDue)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {/* 4. Bottom 4 Columns: Bank Details | QR | Terms | Signature */}
        <div className="grid grid-cols-12 divide-x divide-slate-900 p-1.5 text-[8px] items-center">
          {/* Bank Details */}
          <div className="col-span-4 space-y-0.5 pr-1">
            <span className="font-bold uppercase text-slate-500 block">Bank Details</span>
            <p>Name: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
            <p>A/C: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
            <p>IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
          </div>

          {/* UPI QR */}
          <div className="col-span-3 flex items-center justify-center px-1">
            <UpiQrBadge doc={doc} size={54} layout="stacked" />
          </div>

          {/* Terms */}
          <div className="col-span-3 px-1">
            <span className="font-bold uppercase text-slate-500 block">Terms &amp; Conditions</span>
            <p className="text-slate-500 leading-tight line-clamp-3">
              {doc.terms || "Goods once sold cannot be returned or exchanged."}
            </p>
          </div>

          {/* Signature */}
          <div className="col-span-2 pl-1 flex flex-col items-center justify-end">
            <SignatureBlock doc={doc} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
