import React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { GstSummaryMatrix } from "../shared/gst-summary-matrix";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A4AdvancedGstTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-slate-900 text-xs p-6 print:p-0 font-sans document-print-root avoid-break">
      {/* 1. Header Box - Strict Single A4 Page Dimensions */}
      <div className="border-2 border-slate-900 mb-0 print:border-2">
        <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-1.5 font-bold tracking-wider uppercase text-sm">
            <span>{doc.documentTitle}</span>
            <span className="text-xs font-mono font-normal">Original For Recipient</span>
          </div>

          <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
            {/* Business Details (Left 7 Cols) */}
            <div className="col-span-7 p-3 flex gap-3">
              {doc.tenant.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.tenant.logoUrl}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded border border-slate-200"
                />
              )}
              <div className="space-y-0.5 text-[11px] leading-tight">
                <h1 className="text-base font-black text-slate-900">{doc.tenant.businessName}</h1>
                {doc.tenant.address && <p className="text-slate-700">{doc.tenant.address}</p>}
                <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-600 pt-0.5">
                  {doc.tenant.phone && <span>Mobile: {doc.tenant.phone}</span>}
                  {doc.tenant.email && <span>Email: {doc.tenant.email}</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 text-[10px] font-bold text-slate-900 pt-0.5">
                  {doc.tenant.gstin && <span>GSTIN: {doc.tenant.gstin}</span>}
                  {doc.tenant.pan && <span>PAN: {doc.tenant.pan}</span>}
                </div>
              </div>
            </div>

            {/* Document Meta (Right 5 Cols) */}
            <div className="col-span-5 divide-y-2 divide-slate-900 text-[11px]">
              <div className="p-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    {isQuotation ? "Quotation No." : "Invoice No."}
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{doc.documentNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Date</span>
                  <span className="font-bold text-slate-900">{doc.date}</span>
                </div>
              </div>
              <div className="p-2 grid grid-cols-2 gap-2">
                <div className={doc.placeOfSupply ? "" : "col-span-2"}>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    {doc.dueDateOrValidUntil.label}
                  </span>
                  <span className="font-bold text-slate-900">{doc.dueDateOrValidUntil.value}</span>
                </div>
                {doc.placeOfSupply && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Place of Supply</span>
                    <span className="font-bold text-slate-900">{doc.placeOfSupply}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Bill To & Ship To Boxes */}
          <div className={cn(
            "grid border-t-2 border-slate-900",
            doc.shippingAddress ? "grid-cols-12 divide-x-2 divide-slate-900" : "grid-cols-1"
          )}>
            <div className={cn(doc.shippingAddress ? "col-span-6" : "col-span-12", "p-2.5 bg-slate-50/50")}>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                BILL TO (PARTY)
              </span>
              <p className="font-black text-slate-900 text-xs">{doc.client.name}</p>
              {doc.client.companyName && (
                <p className="font-bold text-slate-800 text-[11px]">{doc.client.companyName}</p>
              )}
              {doc.client.address && (
                <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{doc.client.address}</p>
              )}
              <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-600 mt-1">
                {doc.client.phone && <span>Ph: {doc.client.phone}</span>}
                {doc.client.gstin && <span className="font-bold text-slate-900">GSTIN: {doc.client.gstin}</span>}
              </div>
            </div>

            {doc.shippingAddress && (
              <div className="col-span-6 p-2.5 bg-slate-50/50">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                  SHIP TO / DELIVERY DESTINATION
                </span>
                <p className="text-[10px] text-slate-700 leading-tight">
                  {doc.shippingAddress}
                </p>
                {(doc.eWayBillNo || doc.vehicleNo) && (
                  <div className="mt-1 pt-1 border-t border-slate-200 flex gap-3 text-[10px]">
                    {doc.eWayBillNo && <span>E-Way Bill: <strong className="font-mono">{doc.eWayBillNo}</strong></span>}
                    {doc.vehicleNo && <span>Vehicle No: <strong>{doc.vehicleNo}</strong></span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Items Table with Full Vertical Dividers & Flexible Height */}
          <table className="w-full border-collapse border-t-2 border-slate-900 text-left text-[11px] flex-1">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-900 text-center">
                <th className="py-2 px-1 border-r-2 border-slate-900 w-8">S.N.</th>
                <th className="py-2 px-2 border-r-2 border-slate-900 text-left">ITEMS / SERVICES</th>
                {doc.hasHsn && (
                  <th className="py-2 px-1 border-r-2 border-slate-900 w-16">HSN/SAC</th>
                )}
                <th className="py-2 px-1 border-r-2 border-slate-900 w-14">QTY</th>
                <th className="py-2 px-2 border-r-2 border-slate-900 text-right w-20">RATE (₹)</th>
                {doc.isTaxEnabled && (
                  <th className="py-2 px-1 border-r-2 border-slate-900 text-center w-16">TAX</th>
                )}
                <th className="py-2 px-2 text-right w-24">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {doc.items.map((item, idx) => (
                <tr key={item.id} className="min-h-[30px]">
                  <td className="py-2.5 px-1 border-r-2 border-slate-900 text-center text-slate-600 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-2 border-r-2 border-slate-900">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug whitespace-pre-line">
                        {item.description}
                      </p>
                    )}
                  </td>
                  {doc.hasHsn && (
                    <td className="py-2.5 px-1 border-r-2 border-slate-900 text-center font-mono text-[10px]">
                      {item.hsnSacCode || "-"}
                    </td>
                  )}
                  <td className="py-2.5 px-1 border-r-2 border-slate-900 text-center font-mono font-bold">
                    {item.quantity} <span className="text-[9px] font-normal text-slate-500">{item.unit}</span>
                  </td>
                  <td className="py-2.5 px-2 border-r-2 border-slate-900 text-right font-mono">
                    {formatCurrency(item.rate)}
                  </td>
                  {doc.isTaxEnabled && (
                    <td className="py-2.5 px-1 border-r-2 border-slate-900 text-center font-mono text-[10px]">
                      {item.taxRate !== undefined ? `${item.taxRate}%` : "-"}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {/* Clean compact fill lines for authentic billbook look fitting safely on 1 A4 page */}
              {doc.items.length < 5 &&
                Array.from({ length: Math.max(0, 4 - doc.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-6 print:h-5">
                    <td className="border-r-2 border-slate-900 py-0.5 text-center text-transparent select-none">&nbsp;</td>
                    <td className="border-r-2 border-slate-900 py-0.5 text-transparent select-none">&nbsp;</td>
                    {doc.hasHsn && <td className="border-r-2 border-slate-900 py-0.5 text-transparent select-none">&nbsp;</td>}
                    <td className="border-r-2 border-slate-900 py-0.5 text-transparent select-none">&nbsp;</td>
                    <td className="border-r-2 border-slate-900 py-0.5 text-transparent select-none">&nbsp;</td>
                    {doc.isTaxEnabled && <td className="border-r-2 border-slate-900 py-0.5 text-transparent select-none">&nbsp;</td>}
                    <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-slate-900">
                <td colSpan={doc.hasHsn ? 3 : 2} className="py-1.5 px-2 border-r-2 border-slate-900 text-right">
                  SUBTOTAL
                </td>
                <td className="py-1.5 px-1 border-r-2 border-slate-900 text-center font-mono">
                  {doc.items.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td className="border-r-2 border-slate-900"></td>
                {doc.isTaxEnabled && (
                  <td className="py-1.5 px-1 border-r-2 border-slate-900 text-center font-mono">
                    {formatCurrency(doc.totalTax)}
                  </td>
                )}
                <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(doc.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 4. GST Summary Matrix */}
          {doc.isTaxEnabled && (
            <div className="p-2 border-t-2 border-slate-900 bg-white">
              <GstSummaryMatrix doc={doc} theme="classic" />
            </div>
          )}

          {/* 5. Summary & Words Row */}
          <div className="border-t-2 border-slate-900 grid grid-cols-12 divide-x-2 divide-slate-900">
          {/* Amount In Words (Left 7 Cols) */}
          <div className="col-span-7 p-2.5 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Amount (In Words):
              </span>
              <p className="font-bold text-slate-900 text-xs italic mt-0.5 capitalize">
                {doc.totalInWords}
              </p>
            </div>
            {doc.terms && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[9px] font-bold text-slate-600 uppercase">Terms & Conditions:</span>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5 whitespace-pre-line">{doc.terms}</p>
              </div>
            )}
          </div>

          {/* Payment & Balance Totals (Right 5 Cols) */}
          <div className="col-span-5 p-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount:</span>
              <span className="font-mono">{formatCurrency(doc.subtotal - doc.discountAmount)}</span>
            </div>
            {doc.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(doc.discountAmount)}</span>
              </div>
            )}
            {doc.isTaxEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>Total Tax (GST):</span>
                <span className="font-mono">+{formatCurrency(doc.totalTax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t-2 border-slate-900">
              <span>TOTAL AMOUNT:</span>
              <span className="font-mono">{formatCurrency(doc.totalAmount)}</span>
            </div>
            {isQuotation && doc.advanceAmount !== undefined && doc.advanceAmount > 0 && (
              <>
                <div className="flex justify-between text-emerald-800 font-bold pt-1 border-t border-slate-200 text-[11px]">
                  <span>
                    Booking Advance (
                    {doc.advanceType === "percentage" && doc.advanceValue
                      ? `${doc.advanceValue}%`
                      : `${Math.round((doc.advanceAmount / (doc.totalAmount || 1)) * 100)}%`}
                    ):
                  </span>
                  <span className="font-mono">{formatCurrency(doc.advanceAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold bg-slate-100 p-1 rounded text-xs">
                  <span>BALANCE ON DELIVERY:</span>
                  <span className="font-mono">{formatCurrency(Math.max(0, doc.totalAmount - doc.advanceAmount))}</span>
                </div>
              </>
            )}
            {!isQuotation && (
              <>
                <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span>Received Amount:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(doc.receivedAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold bg-slate-100 p-1 rounded">
                  <span>BALANCE DUE:</span>
                  <span className="font-mono">{formatCurrency(doc.balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 6. Bank Details, QR & Signature Box */}
        <div className="border-t-2 border-slate-900 grid grid-cols-12 divide-x-2 divide-slate-900 p-2.5 bg-white avoid-break">
          {/* Bank Details */}
          <div className="col-span-5 text-[10px] space-y-0.5">
            <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">
              BANK DETAILS FOR PAYMENT
            </span>
            <p>A/C Name: <strong>{doc.tenant.bankDetails.accountName || doc.tenant.businessName}</strong></p>
            <p>Bank: <strong>{doc.tenant.bankDetails.bankName || "-"}</strong></p>
            <p>A/C No: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
            <p>IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
            {doc.tenant.bankDetails.upiId && (
              <p className="text-emerald-700 font-bold">UPI ID: {doc.tenant.bankDetails.upiId}</p>
            )}
          </div>

          {/* Scan & Pay QR */}
          <div className="col-span-3 flex items-center justify-center p-1">
            <UpiQrBadge doc={doc} size={76} layout="stacked" />
          </div>

          {/* Authorized Signature */}
          <div className="col-span-4 flex items-center justify-center p-1">
            <SignatureBlock doc={doc} />
          </div>
        </div>
      </div>
      <p className="text-center text-[9px] text-slate-400 mt-1 print:hidden">
        Generated with BillEase • Compliant Indian GST Tax Invoice
      </p>
    </div>
  );
}
