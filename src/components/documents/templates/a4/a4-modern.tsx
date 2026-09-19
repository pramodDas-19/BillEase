import React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { NormalizedDocument } from "../shared/template-adapter";
import { getUpiQrImageUrl } from "@/lib/upi";

export function A4ModernTemplate({ doc }: { doc: NormalizedDocument }) {
  const isQuotation = doc.documentType === "quotation";
  const hasHsnSac = doc.items.some((item) => Boolean(item.hsnSacCode));
  const hasQtyOrRate = doc.items.some((item) => (item.quantity ?? 0) > 0 || (item.rate ?? 0) > 0);

  const totalItemDiscounts = doc.items.reduce((acc, it) => {
    const dAmt = (it.discountAmount !== undefined && it.discountAmount > 0)
      ? it.discountAmount
      : (it.discountValue && it.discountValue > 0
          ? (it.discountType === "fixed"
              ? it.discountValue
              : Math.round(((it.amount * it.discountValue) / Math.max(1, 100 - it.discountValue)) * 100) / 100)
          : 0);
    return acc + dAmt;
  }, 0);

  const taxableAmount = Math.max(0, doc.subtotal - doc.discountAmount);

  // Dynamic QR code preview
  const qrImageUrl = doc.upiUri ? getUpiQrImageUrl(doc.upiUri, 200) : doc.upiQrUrl;

  const contactParts = [
    doc.tenant.phone ? `Phone: ${doc.tenant.phone}` : null,
    doc.tenant.email ? `Email: ${doc.tenant.email}` : null,
    doc.tenant.gstin ? `GSTIN: ${doc.tenant.gstin}` : null,
    doc.tenant.pan ? `PAN: ${doc.tenant.pan}` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 sm:p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none text-xs font-sans document-print-root avoid-break">
      {/* 1. Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4 print:pb-2 print:mb-3">
        {/* Left: Business Identity & Contact */}
        <div className="max-w-md space-y-1">
          {doc.tenant.logoUrl ? (
            <div className="mb-2 print:mb-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.tenant.logoUrl}
                alt={doc.tenant.businessName}
                className="h-16 sm:h-20 w-auto max-w-[240px] object-contain object-left print:h-16"
              />
            </div>
          ) : (
            <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs mb-2">
              {doc.tenant.businessName ? doc.tenant.businessName.charAt(0).toUpperCase() : "B"}
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              {doc.tenant.businessName}
            </h1>

            {doc.tenant.address && (
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                {doc.tenant.address}
              </p>
            )}

            {contactParts.length > 0 && (
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {contactParts.join(" • ")}
              </p>
            )}
          </div>
        </div>

        {/* Right: Document Title & Meta */}
        <div className="text-right space-y-0.5 shrink-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
            {doc.documentTitle}
          </h2>
          <p className="text-sm font-extrabold text-slate-800 font-mono">
            #{doc.documentNumber}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            Date: <span className="font-bold text-slate-800">{doc.date}</span>
          </p>
          {doc.dueDateOrValidUntil && (
            <p className="text-[11px] text-slate-600 font-medium">
              {doc.dueDateOrValidUntil.label}:{" "}
              <span className="font-bold text-slate-800">{doc.dueDateOrValidUntil.value}</span>
            </p>
          )}
          {doc.placeOfSupply && (
            <p className="text-[11px] text-slate-600 font-medium">
              Place of Supply: <span className="font-bold text-slate-800">{doc.placeOfSupply}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Client & Delivery Details Cards */}
      <div className={cn("mb-4 print:mb-3", doc.shippingAddress ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "grid grid-cols-1")}>
        {/* Bill To Card */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
            {isQuotation ? "QUOTATION FOR" : "BILL TO"}
          </p>
          <div className="rounded-xl border border-slate-300 p-3 print:p-2 space-y-0.5 bg-white">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">{doc.client.name}</h3>
            {doc.client.companyName && (
              <p className="text-xs font-extrabold text-slate-800 tracking-tight">
                {doc.client.companyName}
              </p>
            )}
            {doc.client.address && (
              <p className="text-[11px] text-slate-600 leading-tight">{doc.client.address}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 pt-0.5">
              {doc.client.phone && <span>Phone: {doc.client.phone}</span>}
              {doc.client.email && <span>Email: {doc.client.email}</span>}
              {doc.client.gstin && (
                <span className="font-bold text-slate-800">GSTIN: {doc.client.gstin}</span>
              )}
              {doc.client.pan && (
                <span className="font-bold text-slate-800">PAN: {doc.client.pan}</span>
              )}
            </div>
          </div>
        </div>

        {/* Ship To Card (Only when shipping address exists) */}
        {doc.shippingAddress && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
              SHIP TO / DELIVERY DESTINATION
            </p>
            <div className="rounded-xl border border-slate-300 p-3 print:p-2 space-y-0.5 bg-slate-50/50">
              <p className="text-[11px] text-slate-700 leading-tight whitespace-pre-line">
                {doc.shippingAddress}
              </p>
              {(doc.eWayBillNo || doc.vehicleNo) && (
                <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-600 pt-1 border-t border-slate-200 mt-1">
                  {doc.eWayBillNo && <span>E-Way Bill: <strong className="font-mono">{doc.eWayBillNo}</strong></span>}
                  {doc.vehicleNo && <span>Vehicle No: <strong>{doc.vehicleNo}</strong></span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Items Table */}
      <table className="w-full border-collapse text-left text-xs mb-4 print:mb-3">
        <thead>
          <tr className="border-t-2 border-b-2 border-slate-900 bg-slate-50">
            <th className="py-2.5 px-2.5 font-black text-slate-900 w-10 text-center">#</th>
            <th className="py-2.5 px-2.5 font-black text-slate-900">DESCRIPTION</th>
            {hasHsnSac && (
              <th className="py-2.5 px-2.5 font-black text-slate-900 text-center w-20">HSN/SAC</th>
            )}
            {hasQtyOrRate && (
              <>
                <th className="py-2.5 px-2.5 font-black text-slate-900 text-center w-16">QTY</th>
                <th className="py-2.5 px-2.5 font-black text-slate-900 text-right w-20">RATE</th>
              </>
            )}
            <th className="py-2.5 px-2.5 font-black text-slate-900 text-right w-24">AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
          {doc.items.map((item, idx) => {
            const itDiscAmt = (item.discountAmount !== undefined && item.discountAmount > 0)
              ? item.discountAmount
              : (item.discountValue && item.discountValue > 0
                  ? (item.discountType === "fixed"
                      ? item.discountValue
                      : Math.round(((item.amount * item.discountValue) / Math.max(1, 100 - item.discountValue)) * 100) / 100)
                  : 0);

            return (
              <tr key={item.id || idx} className="align-top">
                <td className="py-2.5 px-2.5 text-center text-slate-500 font-bold font-mono text-[11px]">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="py-2.5 px-2.5">
                  <p className="font-bold text-slate-900">
                    {item.name || item.description}
                    {doc.isTaxEnabled && item.taxRate !== undefined && item.taxRate !== null && (
                      <span className="text-[10px] font-semibold text-slate-500 ml-1.5 font-sans">
                        (GST {item.taxRate}%)
                      </span>
                    )}
                  </p>
                  {Boolean(item.discountValue && item.discountValue > 0) && (
                    <div className="mt-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🏷️ Includes {item.discountValue}{item.discountType === "fixed" ? " ₹" : "%"} discount
                        {itDiscAmt > 0 ? ` (-${formatCurrency(itDiscAmt)})` : ""}
                      </span>
                    </div>
                  )}
                  {item.description && item.name && item.description !== item.name && (
                    <p className="mt-0.5 text-[10px] text-slate-600 whitespace-pre-line leading-tight">
                      {item.description}
                    </p>
                  )}
                </td>
                {hasHsnSac && (
                  <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-[10px] text-slate-700">
                    {item.hsnSacCode || "—"}
                  </td>
                )}
                {hasQtyOrRate && (
                  <>
                    <td className="py-2.5 px-2.5 text-center text-slate-700 font-medium">
                      {item.quantity !== undefined ? `${item.quantity} ${item.unit || ""}` : "—"}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-700 font-mono">
                      {item.rate !== undefined ? formatCurrency(item.rate) : "—"}
                    </td>
                  </>
                )}
                <td className="py-2.5 px-2.5 text-right font-mono">
                  {Boolean(item.discountValue && item.discountValue > 0 && itDiscAmt > 0) ? (
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block font-normal">
                        {formatCurrency(item.amount + itDiscAmt)}
                      </span>
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 font-sans block">
                        (-{item.discountValue}{item.discountType === "fixed" ? "₹" : "%"} off)
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. Calculations Block */}
      <div className="flex justify-end mb-4 print:mb-3">
        <div className="w-72 space-y-1 text-xs text-right">
          {totalItemDiscounts > 0 ? (
            <>
              <div className="flex justify-between text-slate-500">
                <span>Original Total</span>
                <span className="font-mono line-through">
                  {formatCurrency(doc.subtotal + totalItemDiscounts)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Item Discounts</span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(totalItemDiscounts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Net Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(doc.subtotal)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(doc.subtotal)}
              </span>
            </div>
          )}

          {Boolean(doc.discountAmount && doc.discountAmount > 0) && (
            <div className="flex justify-between text-rose-600">
              <span className="font-medium">Discount</span>
              <span className="font-mono">-{formatCurrency(doc.discountAmount)}</span>
            </div>
          )}

          {doc.isTaxEnabled && (
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Taxable Amount</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(taxableAmount)}
              </span>
            </div>
          )}

          {doc.isTaxEnabled && doc.taxBreakdown && doc.taxBreakdown.length > 0 && (
            <>
              {doc.taxBreakdown.map((t, i) => (
                <div key={i} className="flex justify-between text-slate-700 text-[11px]">
                  <span>{t.isInterState ? `IGST (${t.rate}%)` : `GST (${t.rate}%)`}:</span>
                  <span className="font-mono">+{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t-2 border-b-2 border-slate-900 py-1.5 my-1 flex justify-between font-black text-sm text-slate-900">
            <span>TOTAL</span>
            <span className="font-mono text-base">{formatCurrency(doc.totalAmount)}</span>
          </div>

          {/* Quotation Advance Required vs Balance on Delivery */}
          {isQuotation && doc.advanceAmount !== undefined && doc.advanceAmount > 0 && (
            <div className="pt-1.5 mt-1 border-t border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between text-xs text-emerald-800 font-bold">
                <span>
                  Booking Advance (
                  {doc.advanceType === "percentage" && doc.advanceValue
                    ? `${doc.advanceValue}%`
                    : `${Math.round((doc.advanceAmount / (doc.totalAmount || 1)) * 100)}%`}
                  ):
                </span>
                <span className="font-mono">{formatCurrency(doc.advanceAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Balance on Delivery:</span>
                <span className="font-mono text-slate-800 font-bold">
                  {formatCurrency(Math.max(0, doc.totalAmount - doc.advanceAmount))}
                </span>
              </div>
            </div>
          )}

          {/* Invoice Paid vs Balance Due */}
          {!isQuotation && (
            <div className="pt-1.5 mt-1 border-t border-dashed border-slate-300 space-y-1">
              {doc.receivedAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-800 font-bold">
                  <span>Paid Amount:</span>
                  <span className="font-mono">{formatCurrency(doc.receivedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-900 font-black">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(doc.balanceDue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Amount in Words */}
      <div className="mb-4 print:mb-3 p-3 print:p-2 rounded-xl border border-slate-200 bg-slate-50/60">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
          AMOUNT IN WORDS
        </p>
        <p className="text-[11px] font-bold text-slate-900 mt-0.5">
          {doc.totalInWords}
        </p>
      </div>

      {/* 6. Terms & Conditions and Notes Box */}
      {(doc.terms || doc.notes) && (
        <div className="mb-4 print:mb-3 p-3.5 print:p-2.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
          {doc.terms && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
                TERMS & CONDITIONS
              </p>
              <div className="whitespace-pre-line text-[11px] text-slate-600 leading-relaxed">
                {doc.terms}
              </div>
            </div>
          )}

          {doc.notes && (
            <div className={doc.terms ? "pt-2 border-t border-slate-100" : ""}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-0.5">
                NOTES
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                {doc.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. Payment Information & Authorized Signature Split */}
      <div className="mb-4 print:mb-3 grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden avoid-break">
        {/* Left: UPI Payment info & QR Code */}
        <div className="p-3.5 print:p-2.5 space-y-2 bg-white flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
              PAYMENT INFORMATION
            </p>
            <div className="space-y-0.5 text-[11px] text-slate-700 mt-1.5">
              {doc.tenant.bankDetails.upiId && (
                <p>
                  <span className="text-slate-500 font-medium">UPI ID:</span>{" "}
                  <span className="font-mono font-bold text-emerald-800">{doc.tenant.bankDetails.upiId}</span>
                </p>
              )}
              {doc.tenant.bankDetails.accountName && (
                <p>
                  <span className="text-slate-500 font-medium">A/C Name:</span>{" "}
                  <span className="font-semibold text-slate-900">{doc.tenant.bankDetails.accountName}</span>
                </p>
              )}
              {doc.tenant.bankDetails.bankName && (
                <p>
                  <span className="text-slate-500 font-medium">Bank:</span>{" "}
                  <span className="font-semibold text-slate-900">{doc.tenant.bankDetails.bankName}</span>
                </p>
              )}
              {doc.tenant.bankDetails.accountNumber && (
                <p>
                  <span className="text-slate-500 font-medium">A/C Number:</span>{" "}
                  <span className="font-mono font-semibold text-slate-900">{doc.tenant.bankDetails.accountNumber}</span>
                </p>
              )}
              {doc.tenant.bankDetails.ifscCode && (
                <p>
                  <span className="text-slate-500 font-medium">IFSC:</span>{" "}
                  <span className="font-mono font-semibold text-slate-900">{doc.tenant.bankDetails.ifscCode}</span>
                </p>
              )}
            </div>
          </div>

          {qrImageUrl && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt="UPI Payment QR Code"
                className="w-16 h-16 rounded border border-slate-200"
              />
              <div>
                <p className="text-[10px] font-bold text-slate-900">Scan to Pay via UPI</p>
                <p className="text-[9px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM, Cred</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Authorized Signature */}
        <div className="p-3.5 print:p-2.5 flex flex-col justify-between items-end text-right bg-white">
          <div>
            <p className="text-[10px] font-bold text-slate-700">
              For <span className="text-slate-900 font-extrabold">{doc.tenant.businessName}</span>
            </p>
          </div>

          <div className="w-full flex flex-col items-end pt-6">
            <div className="h-14 print:h-12 flex items-end justify-end mb-1">
              {doc.tenant.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.tenant.signatureUrl}
                  alt="Authorized Digital Signature"
                  className="max-h-12 max-w-[150px] object-contain"
                />
              ) : (
                <div className="h-10 w-44" />
              )}
            </div>
            <div className="w-44 border-b-2 border-slate-800" />
            <p className="text-[9px] font-extrabold text-slate-900 uppercase tracking-wider mt-1">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>

      {/* 8. Bottom Footer */}
      <div className="pt-2 print:pt-1 border-t border-slate-200 text-center space-y-0.5">
        <p className="text-[11px] font-semibold text-slate-700">
          Thank you for your business.
        </p>
        <p className="text-[9px] font-medium text-slate-400">
          Powered by BillEase
        </p>
      </div>
    </div>
  );
}
