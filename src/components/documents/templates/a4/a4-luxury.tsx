import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A4LuxuryTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-xs p-8 print:p-0 font-serif document-print-root avoid-break">
      {/* Outer Ornate Double Border with Gold Accents */}
      <div className="relative border-2 border-amber-600/80 p-5 rounded-sm shadow-xs print:shadow-none print:p-4">
        {/* Ornate Corner Accents */}
        <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-2 border-l-2 border-amber-700 pointer-events-none"></div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-2 border-r-2 border-amber-700 pointer-events-none"></div>
        <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-2 border-l-2 border-amber-700 pointer-events-none"></div>
        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-2 border-r-2 border-amber-700 pointer-events-none"></div>

        {/* 1. Top Header */}
        <div className="flex justify-between items-start pb-4 border-b border-amber-300">
          <div className="flex items-center gap-4">
            {doc.tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.tenant.logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-lg border border-amber-200"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{doc.tenant.businessName}</h1>
              <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-600 mt-1 font-sans">
                {doc.tenant.pan && <span>PAN: <strong className="text-slate-800">{doc.tenant.pan}</strong></span>}
                {doc.tenant.gstin && <span>GSTIN: <strong className="text-slate-800">{doc.tenant.gstin}</strong></span>}
              </div>
              <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-600 font-sans mt-0.5">
                {doc.tenant.phone && <span>Ph: {doc.tenant.phone}</span>}
                {doc.tenant.email && <span>Email: {doc.tenant.email}</span>}
              </div>
              {doc.tenant.address && (
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">{doc.tenant.address}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-black tracking-wider text-amber-900 uppercase">
              {doc.documentTitle}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-amber-700/80 font-sans mt-1">
              Royal Edition • Original
            </p>
          </div>
        </div>

        {/* 2. Metadata Ribbon */}
        <div className="grid grid-cols-6 border-b border-amber-200 py-2 text-[10px] font-sans bg-amber-50/50 -mx-5 px-5 my-0">
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">
              {isQuotation ? "Quotation #" : "Invoice #"}
            </span>
            <span className="font-bold text-slate-900 font-mono text-xs">{doc.documentNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">Created On</span>
            <span className="font-bold text-slate-800">{doc.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">{doc.dueDateOrValidUntil.label}</span>
            <span className="font-bold text-slate-800">{doc.dueDateOrValidUntil.value}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">E-Way Bill</span>
            <span className="font-mono text-slate-700">{doc.eWayBillNo || "-"}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">PO Number</span>
            <span className="font-mono text-slate-700">{doc.poNumber || "-"}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[9px]">Vehicle No.</span>
            <span className="font-bold text-slate-700">{doc.vehicleNo || "-"}</span>
          </div>
        </div>

        {/* 3. Bill To & Ship To Banner */}
        <div className={doc.shippingAddress ? "grid grid-cols-2 gap-3 my-3" : "grid grid-cols-1 my-3"}>
          <div className="bg-amber-50/20 p-2.5 rounded border border-amber-100">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
              BILL TO:
            </span>
            <p className="font-bold text-slate-900 text-sm">{doc.client.name}</p>
            {doc.client.companyName && (
              <p className="font-bold text-slate-800 text-[11px]">{doc.client.companyName}</p>
            )}
            {doc.client.address && (
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{doc.client.address}</p>
            )}
            <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-600 mt-1 font-mono">
              {doc.client.phone && <span>Mobile: {doc.client.phone}</span>}
              {doc.client.gstin && <span className="font-bold text-amber-900">GSTIN: {doc.client.gstin}</span>}
            </div>
            {doc.placeOfSupply && (
              <p className="text-[9px] text-slate-500 mt-0.5">Place of Supply: {doc.placeOfSupply}</p>
            )}
          </div>

          {doc.shippingAddress && (
            <div className="bg-amber-50/20 p-2.5 rounded border border-amber-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                SHIP TO:
              </span>
              <p className="text-[10px] text-slate-600 leading-snug">
                {doc.shippingAddress}
              </p>
            </div>
          )}
        </div>

        {/* 4. Luxury Items Table */}
        <table className="w-full text-left font-sans text-xs my-3 border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 font-bold border-y border-amber-400 text-[10px] uppercase tracking-wider">
              <th className="py-2 px-2 w-8 text-center">No.</th>
              <th className="py-2 px-2">Items</th>
              {doc.hasHsn && <th className="py-2 px-2 text-center w-16">HSN No.</th>}
              <th className="py-2 px-2 text-center w-16">Quantity</th>
              <th className="py-2 px-2 text-right w-20">Price/Item (₹)</th>
              <th className="py-2 px-2 text-right w-16">Discount</th>
              <th className="py-2 px-2 text-right w-24">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 text-[11px]">
            {doc.items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-amber-50/30">
                <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="py-2 px-2">
                  <p className="font-bold text-slate-900 font-serif">{item.name}</p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight mt-0.5">
                      {item.description}
                    </p>
                  )}
                </td>
                {doc.hasHsn && (
                  <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600">
                    {item.hsnSacCode || "-"}
                  </td>
                )}
                <td className="py-2 px-2 text-center font-mono font-bold">
                  {item.quantity} <span className="text-[9px] font-normal text-slate-500">{item.unit}</span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-slate-700">{formatCurrency(item.rate)}</td>
                <td className="py-2 px-2 text-right font-mono text-slate-600">
                  {item.discountAmount ? formatCurrency(item.discountAmount) : "0"}
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {/* Height filler lines for balanced A4 sheet */}
            {doc.items.length < 5 &&
              Array.from({ length: Math.max(0, 4 - doc.items.length) }).map((_, i) => (
                <tr key={`fill-${i}`} className="h-6 print:h-5">
                  <td className="py-0.5 text-center text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                  {doc.hasHsn && <td className="py-0.5 text-transparent select-none">&nbsp;</td>}
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-amber-400 bg-amber-50/60 font-bold text-amber-950">
              <td colSpan={doc.hasHsn ? 3 : 2} className="py-2 px-2 text-right uppercase text-[10px]">
                Total Items: {doc.items.length}
              </td>
              <td className="py-2 px-2 text-center font-mono">
                {doc.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2 text-right font-mono">
                {formatCurrency(doc.discountAmount)}
              </td>
              <td className="py-2 px-2 text-right font-mono text-sm font-black text-amber-950">
                {formatCurrency(doc.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* 5. Bottom Section: Notes & Terms (Left) / Financial Breakdown (Right) */}
        <div className="pt-3 border-t border-amber-200 font-sans text-xs avoid-break">
          <div className="grid grid-cols-12 gap-6">
          {/* Left Column (7 Cols): Notes, Terms, Bank & QR */}
          <div className="col-span-7 space-y-3">
            {doc.notes && (
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block">Notes</span>
                <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{doc.notes}</p>
              </div>
            )}

            {doc.terms && (
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block">
                  Terms &amp; Condition
                </span>
                <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed mt-0.5">{doc.terms}</p>
              </div>
            )}

            {/* Bank Details & Dynamic QR */}
            <div className="pt-2 border-t border-amber-200 flex gap-4 items-center">
              <div className="text-[10px] space-y-0.5 flex-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block">
                  Bank Details
                </span>
                <p>A/C Name: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
                <p>Bank: <strong>{doc.tenant.bankDetails.bankName || "-"}</strong></p>
                <p>Account No: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
                <p>IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
              </div>

              <div className="shrink-0">
                <UpiQrBadge doc={doc} size={70} layout="stacked" />
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols): Calculation Breakdown & Signature */}
          <div className="col-span-5 space-y-2">
            <div className="bg-amber-50/40 p-3 rounded border border-amber-200 space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatCurrency(doc.subtotal - doc.discountAmount)}</span>
              </div>

              {doc.isTaxEnabled &&
                doc.taxBreakdown.map((t, idx) => (
                  <div key={idx} className="space-y-0.5">
                    {!t.isInterState ? (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>CGST @{t.rate / 2}%:</span>
                          <span className="font-mono">{formatCurrency(t.cgstAmount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>SGST @{t.rate / 2}%:</span>
                          <span className="font-mono">{formatCurrency(t.sgstAmount)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>IGST @{t.rate}%:</span>
                        <span className="font-mono">{formatCurrency(t.igstAmount)}</span>
                      </div>
                    )}
                  </div>
                ))}

              <div className="flex justify-between font-black text-sm text-amber-950 pt-2 border-t border-amber-300">
                <span>Total Amount:</span>
                <span className="font-mono">{formatCurrency(doc.totalAmount)}</span>
              </div>

              {isQuotation && doc.advanceAmount !== undefined && doc.advanceAmount > 0 && (
                <>
                  <div className="flex justify-between text-amber-900 text-[11px] font-bold">
                    <span>
                      Booking Advance (
                      {doc.advanceType === "percentage" && doc.advanceValue
                        ? `${doc.advanceValue}%`
                        : `${Math.round((doc.advanceAmount / (doc.totalAmount || 1)) * 100)}%`}
                      ):
                    </span>
                    <span className="font-mono">{formatCurrency(doc.advanceAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-950 font-bold bg-amber-200/60 px-1.5 py-0.5 rounded text-xs">
                    <span>Balance on Delivery:</span>
                    <span className="font-mono">{formatCurrency(Math.max(0, doc.totalAmount - doc.advanceAmount))}</span>
                  </div>
                </>
              )}

              {!isQuotation && (
                <>
                  <div className="flex justify-between text-emerald-800 text-[11px]">
                    <span>Received Amount:</span>
                    <span className="font-mono font-bold">{formatCurrency(doc.receivedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-900 font-bold bg-amber-200/60 px-1.5 py-0.5 rounded text-xs">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(doc.balanceDue)}</span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-amber-200">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                  Total Amount (In Words):
                </span>
                <p className="font-serif italic font-bold text-slate-800 text-[11px] capitalize mt-0.5">
                  {doc.totalInWords}
                </p>
              </div>
            </div>

            {/* Signature Box */}
            <div className="pt-2 flex justify-end">
              <SignatureBlock doc={doc} compact />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
