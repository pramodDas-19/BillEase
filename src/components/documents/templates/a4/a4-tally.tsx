import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { GstSummaryMatrix } from "../shared/gst-summary-matrix";
import { UpiQrBadge } from "../shared/upi-qr-badge";
import { SignatureBlock } from "../shared/signature-block";

export function A4TallyTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";

  return (
    <div className="w-full bg-white text-black text-[11px] p-6 print:p-0 font-sans leading-tight document-print-root avoid-break">
      <div className="border border-black">
        {/* Header Bar */}
        <div className="border-b border-black text-center py-1 bg-slate-100 font-bold uppercase tracking-wider text-xs">
            {doc.documentTitle}
          </div>

        {/* Company and Invoice Details Grid */}
        <div className="grid grid-cols-2 divide-x border-b border-black divide-black">
          {/* Left: Supplier Info */}
          <div className="p-2 space-y-1">
            <div className="font-bold text-sm uppercase">{doc.tenant.businessName}</div>
            <div className="text-[10px] text-neutral-800">{doc.tenant.address}</div>
            <div className="text-[10px]">
              {doc.tenant.phone && <span>Ph: {doc.tenant.phone} | </span>}
              {doc.tenant.email && <span>Email: {doc.tenant.email}</span>}
            </div>
            <div className="text-[10px] font-bold">
              {doc.tenant.gstin && <span>GSTIN/UIN: {doc.tenant.gstin}</span>}
              {doc.tenant.pan && <span className="ml-2">State: {doc.placeOfSupply || "State"}</span>}
            </div>
          </div>

          {/* Right: Invoice Metadata */}
          <div className="divide-y divide-black text-[10px]">
            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">
                  {isQuotation ? "Quotation No." : "Invoice No."}
                </span>
                <span className="font-bold font-mono text-xs">{doc.documentNumber}</span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">Dated</span>
                <span className="font-bold">{doc.date}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">Delivery Note</span>
                <span className="font-mono">{doc.eWayBillNo || "-"}</span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">Mode/Terms of Payment</span>
                <span>Immediate / Bank</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">Reference No. & Date</span>
                <span className="font-mono">{doc.poNumber || "-"}</span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-neutral-600 uppercase block font-medium">Dispatched through / Vehicle</span>
                <span>{doc.vehicleNo || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consignee (Ship To) and Buyer (Bill To) */}
        <div className="grid grid-cols-2 divide-x border-b border-black divide-black text-[10px]">
          <div className={doc.shippingAddress ? "p-2 space-y-0.5" : "p-2 space-y-0.5 col-span-2"}>
            <span className="font-bold uppercase text-[9px] text-neutral-700 block">Buyer (Bill to)</span>
            <p className="font-bold text-xs">{doc.client.name}</p>
            {doc.client.companyName && <p className="font-bold">{doc.client.companyName}</p>}
            <p className="text-neutral-700">{doc.client.address}</p>
            {doc.client.gstin && <p className="font-bold">GSTIN/UIN: {doc.client.gstin}</p>}
            {doc.client.pan && <p>PAN/IT No: {doc.client.pan}</p>}
            {doc.placeOfSupply && <p className="font-bold">State Name: {doc.placeOfSupply}</p>}
          </div>
          {doc.shippingAddress && (
            <div className="p-2 space-y-0.5">
              <span className="font-bold uppercase text-[9px] text-neutral-700 block">Consignee (Ship to)</span>
              <p className="font-bold text-xs">{doc.client.name}</p>
              <p className="text-neutral-700">{doc.shippingAddress}</p>
              {doc.placeOfSupply && <p className="font-bold">State Name: {doc.placeOfSupply}</p>}
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black bg-neutral-100 text-center font-bold">
              <th className="border-r border-black p-1 w-8">Sl No.</th>
              <th className="border-r border-black p-1 text-left">Description of Goods / Services</th>
              {doc.hasHsn && <th className="border-r border-black p-1 w-16">HSN/SAC</th>}
              <th className="border-r border-black p-1 w-14">Quantity</th>
              <th className="border-r border-black p-1 text-right w-16">Rate (₹)</th>
              <th className="border-r border-black p-1 w-10">per</th>
              <th className="border-r border-black p-1 text-right w-14">Disc %</th>
              <th className="p-1 text-right w-20">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {doc.items.map((item, idx) => (
              <tr key={item.id} className="align-top">
                <td className="border-r border-black p-1 text-center font-mono">{idx + 1}</td>
                <td className="border-r border-black p-1">
                  <p className="font-bold">{item.name}</p>
                  {item.description && (
                    <p className="text-[9px] text-neutral-600 mt-0.5 whitespace-pre-line">{item.description}</p>
                  )}
                </td>
                {doc.hasHsn && (
                  <td className="border-r border-black p-1 text-center font-mono">{item.hsnSacCode || "-"}</td>
                )}
                <td className="border-r border-black p-1 text-center font-mono font-bold">{item.quantity}</td>
                <td className="border-r border-black p-1 text-right font-mono">{formatCurrency(item.rate)}</td>
                <td className="border-r border-black p-1 text-center">{item.unit}</td>
                <td className="border-r border-black p-1 text-right font-mono">
                  {item.discountValue ? `${item.discountValue}%` : "-"}
                </td>
                <td className="p-1 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Tally height filler lines */}
            {doc.items.length < 5 &&
              Array.from({ length: Math.max(0, 4 - doc.items.length) }).map((_, i) => (
                <tr key={`fill-${i}`} className="h-6 print:h-5">
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  {doc.hasHsn && <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>}
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="border-r border-black py-0.5 text-transparent select-none">&nbsp;</td>
                  <td className="py-0.5 text-transparent select-none">&nbsp;</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-b border-black font-bold bg-neutral-50 text-right">
              <td colSpan={doc.hasHsn ? 3 : 2} className="border-r border-black p-1 text-center">
                Total
              </td>
              <td className="border-r border-black p-1 text-center font-mono">
                {doc.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="p-1 font-mono">{formatCurrency(doc.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* GST Tax Slabs Matrix */}
        {doc.isTaxEnabled && (
          <div className="p-1.5 border-b border-black">
            <GstSummaryMatrix doc={doc} theme="tally" />
          </div>
        )}

        {/* Amount In Words & Terms */}
        <div className="grid grid-cols-2 divide-x border-b border-black divide-black text-[10px]">
          <div className="p-2 space-y-1">
            <p className="text-[9px] text-neutral-600 uppercase font-semibold">Amount Chargeable (in words):</p>
            <p className="font-bold uppercase text-neutral-900">{doc.totalInWords}</p>
            {doc.terms && (
              <div className="mt-2 pt-1 border-t border-black/40">
                <span className="font-bold text-[9px] block">Declaration:</span>
                <p className="text-[9px] text-neutral-700 whitespace-pre-line leading-tight">{doc.terms}</p>
              </div>
            )}
          </div>
          <div className="p-2 divide-y divide-black/30 space-y-1">
            <div className="flex justify-between font-mono">
              <span>Subtotal:</span>
              <span>{formatCurrency(doc.subtotal)}</span>
            </div>
            {doc.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-700 font-mono">
                <span>Discount:</span>
                <span>-{formatCurrency(doc.discountAmount)}</span>
              </div>
            )}
            {doc.isTaxEnabled && (
              <div className="flex justify-between font-mono">
                <span>Total Tax:</span>
                <span>+{formatCurrency(doc.totalTax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold font-mono pt-1 text-xs">
              <span>Total:</span>
              <span>{formatCurrency(doc.totalAmount)}</span>
            </div>
            {isQuotation && doc.advanceAmount !== undefined && doc.advanceAmount > 0 && (
              <>
                <div className="flex justify-between font-mono pt-0.5 text-neutral-800">
                  <span>Advance ({doc.advanceType === "percentage" && doc.advanceValue ? `${doc.advanceValue}%` : `${Math.round((doc.advanceAmount / (doc.totalAmount || 1)) * 100)}%`}):</span>
                  <span className="font-bold">{formatCurrency(doc.advanceAmount)}</span>
                </div>
                <div className="flex justify-between font-mono pt-0.5 text-neutral-800">
                  <span>Balance on Delivery:</span>
                  <span className="font-bold">{formatCurrency(Math.max(0, doc.totalAmount - doc.advanceAmount))}</span>
                </div>
              </>
            )}
            {!isQuotation && (
              <div className="flex justify-between font-mono pt-0.5 text-neutral-700">
                <span>Balance Due:</span>
                <span className="font-bold">{formatCurrency(doc.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details & Signature Block */}
        <div className="grid grid-cols-3 divide-x divide-black p-2 text-[10px] items-center avoid-break">
          <div className="space-y-0.5">
            <span className="font-bold block text-[9px] uppercase">Company&apos;s Bank Details:</span>
            <p>Bank: <strong>{doc.tenant.bankDetails.bankName || "-"}</strong></p>
            <p>A/c No.: <strong className="font-mono">{doc.tenant.bankDetails.accountNumber || "-"}</strong></p>
            <p>Branch &amp; IFSC: <strong className="font-mono">{doc.tenant.bankDetails.ifscCode || "-"}</strong></p>
          </div>
          <div className="flex items-center justify-center p-1">
            <UpiQrBadge doc={doc} size={64} layout="stacked" />
          </div>
          <div className="flex flex-col items-center justify-end">
            <SignatureBlock doc={doc} compact />
          </div>
        </div>
      </div>
      <div className="text-center text-[9px] text-neutral-500 mt-1">This is a Computer Generated Invoice</div>
    </div>
  );
}
