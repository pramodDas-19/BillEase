import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A5TraditionalBahiTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-[#fdfbf7] text-[#4a1c14] text-[10px] p-4 print:p-0 font-serif leading-tight">
      <div className="border-2 border-[#800020] p-3 relative">
        {/* Inner Border */}
        <div className="border border-[#b3541e] p-2">
          {/* Auspicious Inscription */}
          <div className="text-center font-bold text-[10px] text-[#800020] tracking-widest pb-1 border-b border-[#b3541e]/40">
            ॥ श्री गणेशाय नमः ॥ &nbsp;&nbsp;&nbsp;&nbsp; ॥ शुभ लाभ ॥
          </div>

          {/* Business Header */}
          <div className="flex justify-between items-center py-2 border-b border-[#800020]">
            <div>
              <h1 className="text-base font-black text-[#800020]">{doc.tenant.businessName}</h1>
              {doc.tenant.address && <p className="text-[9px] text-[#632a1e]">{doc.tenant.address}</p>}
              <div className="flex gap-3 text-[8px] text-[#632a1e] mt-0.5">
                {doc.tenant.phone && <span>दूरभाष / Ph: {doc.tenant.phone}</span>}
                {doc.tenant.gstin && <span>GSTIN: <strong>{doc.tenant.gstin}</strong></span>}
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold text-[9px] uppercase px-2 py-0.5 bg-[#800020] text-white rounded inline-block">
                {isQuotation ? "अनुमान पत्र / QUOTATION" : "कर बीजक / TAX INVOICE"}
              </span>
              <p className="font-mono font-bold text-xs mt-1 text-[#800020]">
                बिल नं. {doc.documentNumber}
              </p>
              <p className="text-[8px] text-[#632a1e]">दिनांक / Date: {doc.date}</p>
            </div>
          </div>

          {/* Customer (M/s) */}
          <div className="py-1.5 border-b border-[#b3541e]/40 flex justify-between items-center text-[9px]">
            <div>
              <span className="font-bold text-[#800020]">मेसर्स / M/s: </span>
              <strong className="text-xs">{doc.client.name}</strong>
              {doc.client.address && <span className="ml-2 text-[#632a1e]">({doc.client.address})</span>}
            </div>
            {doc.client.phone && <div className="text-[#632a1e]">मो. / Mob: {doc.client.phone}</div>}
          </div>

          {/* Ledger Items Table */}
          <table className="w-full border-collapse text-[9px] my-1.5 border border-[#800020]">
            <thead>
              <tr className="bg-[#fcefe8] border-b border-[#800020] font-bold text-[#800020] text-center">
                <th className="border-r border-[#800020] p-1 w-8">क्र.सं.<br/><span className="text-[7px]">S.N.</span></th>
                <th className="border-r border-[#800020] p-1 text-left">विवरण / Goods Description</th>
                {doc.hasHsn && <th className="border-r border-[#800020] p-1 w-12">HSN</th>}
                <th className="border-r border-[#800020] p-1 w-12">नग / Qty</th>
                <th className="border-r border-[#800020] p-1 text-right w-16">भाव / Rate</th>
                <th className="p-1 text-right w-20">रकम / Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#800020]/20">
              {doc.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="border-r border-[#800020] p-1 text-center font-mono">{idx + 1}</td>
                  <td className="border-r border-[#800020] p-1 font-bold">
                    {item.name}
                    {item.description && <span className="block text-[8px] font-normal text-[#632a1e]">{item.description}</span>}
                  </td>
                  {doc.hasHsn && (
                    <td className="border-r border-[#800020] p-1 text-center font-mono text-[8px]">{item.hsnSacCode || "-"}</td>
                  )}
                  <td className="border-r border-[#800020] p-1 text-center font-mono font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border-r border-[#800020] p-1 text-right font-mono">{formatCurrency(item.rate)}</td>
                  <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#800020] font-black bg-[#fcefe8] text-right">
                <td colSpan={doc.hasHsn ? 3 : 2} className="border-r border-[#800020] p-1 text-center">
                  कुल योग / Total
                </td>
                <td className="border-r border-[#800020] p-1 text-center font-mono">
                  {doc.items.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td className="border-r border-[#800020] p-1"></td>
                <td className="p-1 font-mono text-[#800020]">{formatCurrency(doc.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* In words & Footer */}
          <div className="grid grid-cols-12 gap-2 pt-1 border-t border-[#800020] text-[8px] items-center">
            <div className="col-span-5 space-y-0.5">
              <p className="font-bold text-[#800020]">शब्दों में: <span className="capitalize italic">{doc.totalInWords} रुपए मात्र</span></p>
              <p className="text-[#632a1e]">{doc.terms || "भूल चूक लेनी देनी। बिका माल वापस नहीं होगा।"}</p>
            </div>

            <div className="col-span-3 flex justify-center">
              <UpiQrBadge doc={doc} size={46} layout="stacked" />
            </div>

            <div className="col-span-4 flex justify-end">
              <SignatureBlock doc={doc} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
