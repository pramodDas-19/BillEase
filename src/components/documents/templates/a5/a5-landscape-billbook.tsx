import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A5LandscapeBillbookTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-[10px] p-4 print:p-0 font-sans leading-tight">
      <div className="border border-slate-700">
        {/* Top Title */}
        <div className="text-[8px] font-bold text-slate-500 uppercase px-2 pt-1">
          {isQuotation ? "ESTIMATE" : (doc.isTaxEnabled ? "INVOICE" : "BILL OF SUPPLY")}
        </div>

        {/* Store Header */}
        <div className="text-center pb-2 border-b border-slate-700 px-4">
          <h1 className="text-base font-bold text-slate-900">{doc.tenant.businessName}</h1>
          {doc.tenant.address && <p className="text-[9px] text-slate-600">{doc.tenant.address}</p>}
          {doc.tenant.phone && <p className="text-[9px] text-slate-500">Mobile: {doc.tenant.phone}</p>}
        </div>

        {/* Bill To & Metadata */}
        <div className="grid grid-cols-12 divide-x border-b border-slate-700 divide-slate-700 text-[9px]">
          <div className="col-span-6 p-1.5 space-y-0.5">
            <span className="font-bold text-slate-500 uppercase text-[8px] block">BILL TO</span>
            <p className="font-bold text-slate-900 text-[10px]">{doc.client.name}</p>
            {doc.client.address && <p className="text-slate-600 leading-tight">{doc.client.address}</p>}
            {doc.client.phone && <p className="text-slate-500">Mobile: {doc.client.phone}</p>}
          </div>

          <div className="col-span-6 grid grid-cols-3 divide-x divide-slate-700 p-1 text-center items-center">
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

        {/* Items Table */}
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="border-b border-slate-700 bg-amber-50 text-slate-800 font-bold text-center">
              <th className="border-r border-slate-700 p-1 w-8">S.No.</th>
              <th className="border-r border-slate-700 p-1 text-left">ITEMS</th>
              <th className="border-r border-slate-700 p-1 w-14">QTY.</th>
              <th className="border-r border-slate-700 p-1 text-right w-20">RATE / ITEM</th>
              <th className="p-1 text-right w-24">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {doc.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border-r border-slate-700 p-1 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="border-r border-slate-700 p-1 font-bold text-slate-900">
                  {item.name}
                  {item.description && (
                    <span className="block text-[8px] font-normal text-slate-500">{item.description}</span>
                  )}
                </td>
                <td className="border-r border-slate-700 p-1 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[7px] text-slate-400">{item.unit}</span>
                </td>
                <td className="border-r border-slate-700 p-1 text-right font-mono">{formatCurrency(item.rate)}</td>
                <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-b border-slate-700 font-bold bg-amber-50/70 text-right">
              <td colSpan={2} className="border-r border-slate-700 p-1 text-center">TOTAL AMOUNT</td>
              <td className="border-r border-slate-700 p-1 text-center font-mono">
                {doc.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="border-r border-slate-700 p-1"></td>
              <td className="p-1 font-mono font-black text-slate-900">{formatCurrency(doc.totalAmount)}</td>
            </tr>
            {!isQuotation && (
              <>
                <tr className="border-b border-slate-200 text-right text-slate-600">
                  <td colSpan={4} className="p-0.5 border-r border-slate-700 pr-2">RECEIVED AMOUNT:</td>
                  <td className="p-0.5 font-mono font-bold text-emerald-700">{formatCurrency(doc.receivedAmount)}</td>
                </tr>
                <tr className="border-b border-slate-700 text-right font-bold text-slate-900 bg-amber-100/50">
                  <td colSpan={4} className="p-0.5 border-r border-slate-700 pr-2">BALANCE AMOUNT:</td>
                  <td className="p-0.5 font-mono">{formatCurrency(doc.balanceDue)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {/* Footer Columns: Bank | QR | Terms | Signature */}
        <div className="grid grid-cols-12 divide-x divide-slate-700 p-1.5 text-[8px] items-center">
          <div className="col-span-4 space-y-0.5 pr-1">
            <span className="font-bold uppercase text-slate-500 block">Bank Details</span>
            <p>Name: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
            <p>A/C No: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
            <p>IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
          </div>

          <div className="col-span-3 flex items-center justify-center px-1">
            <UpiQrBadge doc={doc} size={54} layout="stacked" />
          </div>

          <div className="col-span-3 px-1">
            <span className="font-bold uppercase text-slate-500 block">Terms and Conditions</span>
            <p className="text-slate-500 leading-tight">
              {doc.terms || "Goods once sold cannot be returned or exchanged."}
            </p>
          </div>

          <div className="col-span-2 pl-1 flex flex-col items-center justify-end">
            <SignatureBlock doc={doc} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
