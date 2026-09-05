import React from "react";
import { Quotation, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { DocumentHeader } from "./document-header";

interface QuotationPrintDocumentProps {
  quotation: Quotation;
  tenant: Tenant;
}

export function QuotationPrintDocument({ quotation, tenant }: QuotationPrintDocumentProps) {
  const hasQtyOrRate = quotation.items.some((item) => item.quantity !== undefined || item.rate !== undefined);
  const hasHsnSac = quotation.items.some((item) => Boolean(item.hsnSacCode));
  const taxableAmount = Math.max(0, (quotation.subtotal || 0) - (quotation.discountAmount || 0));

  const bankDetails = tenant?.bankDetails || {
    accountName: tenant?.businessName || "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  };

  const upiId = bankDetails.upiId || "";
  const signature = tenant.signatureUrl || tenant.settings?.signatureUrl;

  const payableAmount = quotation.advanceAmount !== undefined && quotation.advanceAmount > 0
    ? quotation.advanceAmount
    : quotation.totalAmount;

  // Generate dynamic QR code URL for quotation advance payment
  const upiUri = generateUpiIntentUrl({
    upiId: upiId || "business@upi",
    businessName: tenant?.businessName || "Business",
    amount: payableAmount,
    transactionRef: quotation.quotationNumber,
    note: quotation.advanceAmount !== undefined && quotation.advanceAmount > 0
      ? `Advance Quote ${quotation.quotationNumber}`
      : `Quote ${quotation.quotationNumber}`,
  });

  const qrImageUrl = getUpiQrImageUrl(upiUri, 200);

  return (
    <div className="mx-auto max-w-4xl bg-white p-4 sm:p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none text-xs">
      {/* 1. Header */}
      <DocumentHeader
        tenant={tenant}
        documentTitle="QUOTATION"
        documentNumber={quotation.quotationNumber}
        date={formatDate(quotation.date)}
        dueDateOrValidUntil={{
          label: "Valid Until",
          value: formatDate(quotation.validUntil),
        }}
      />

      {/* 2. QUOTATION FOR Box */}
      <div className="mb-3 print:mb-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
          QUOTATION FOR
        </p>
        <div className="rounded-xl border border-slate-300 p-2.5 print:p-2 space-y-0.5 bg-white">
          <h3 className="text-xs sm:text-sm font-black text-slate-900">{quotation.clientName}</h3>
          {quotation.clientCompanyName && (
            <p className="text-xs font-extrabold text-slate-800 tracking-tight">
              {quotation.clientCompanyName}
            </p>
          )}
          {quotation.clientAddress && (
            <p className="text-[11px] text-slate-600 leading-tight">{quotation.clientAddress}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 pt-0.5">
            {quotation.clientPhone && <span>Phone: {quotation.clientPhone}</span>}
            {quotation.clientEmail && <span>Email: {quotation.clientEmail}</span>}
            {quotation.clientGstin && (
              <span className="font-bold text-slate-800">GSTIN: {quotation.clientGstin}</span>
            )}
            {quotation.clientPan && (
              <span className="font-bold text-slate-800">PAN: {quotation.clientPan}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <table className="w-full border-collapse text-left text-xs mb-3 print:mb-2">
        <thead>
          <tr className="border-t-2 border-b-2 border-slate-900 bg-slate-50">
            <th className="py-2 px-2.5 font-black text-slate-900 w-10 text-center">#</th>
            <th className="py-2 px-2.5 font-black text-slate-900">DESCRIPTION</th>
            {hasHsnSac && (
              <th className="py-2 px-2.5 font-black text-slate-900 text-center w-20">HSN/SAC</th>
            )}
            {hasQtyOrRate && (
              <>
                <th className="py-2 px-2.5 font-black text-slate-900 text-center w-16">QTY</th>
                <th className="py-2 px-2.5 font-black text-slate-900 text-right w-20">RATE</th>
              </>
            )}
            <th className="py-2 px-2.5 font-black text-slate-900 text-right w-24">AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
          {quotation.items.map((item, idx) => (
            <tr key={item.id} className="align-top">
              <td className="py-2 px-2.5 text-center text-slate-500 font-bold font-mono text-[11px]">
                {String(idx + 1).padStart(2, "0")}
              </td>
              <td className="py-2 px-2.5">
                <p className="font-bold text-slate-900">
                  {item.description}
                  {quotation.isTaxEnabled && item.taxRate !== undefined && (
                    <span className="text-[10px] font-semibold text-slate-500 ml-1.5 font-sans">
                      (GST {item.taxRate}%)
                    </span>
                  )}
                </p>
                {item.detailedNotes && (
                  <p className="mt-0.5 text-[10px] text-slate-600 whitespace-pre-line leading-tight">
                    {item.detailedNotes}
                  </p>
                )}
              </td>
              {hasHsnSac && (
                <td className="py-2 px-2.5 text-center font-mono font-semibold text-[10px] text-slate-700">
                  {item.hsnSacCode || "—"}
                </td>
              )}
              {hasQtyOrRate && (
                <>
                  <td className="py-2 px-2.5 text-center text-slate-700 font-medium">
                    {item.quantity !== undefined ? `${item.quantity} ${item.unit || ""}` : "—"}
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-700 font-mono">
                    {item.rate !== undefined ? (
                      <div>
                        <span>{formatCurrency(item.rate, quotation.currency)}</span>
                        {Boolean(item.discountValue && item.discountValue > 0) && (
                          <span className="block text-[9px] font-bold text-emerald-700 font-sans">
                            (-{item.discountValue}{item.discountType === "fixed" ? "₹" : "%"} off)
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </>
              )}
              <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">
                {formatCurrency(item.amount, quotation.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Calculations Block */}
      <div className="flex justify-end mb-3 print:mb-2">
        <div className="w-64 space-y-1 text-xs text-right">
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Subtotal</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatCurrency(quotation.subtotal, quotation.currency)}
            </span>
          </div>

          {Boolean(quotation.discountAmount && quotation.discountAmount > 0) && (
            <div className="flex justify-between text-rose-600">
              <span className="font-medium">Discount</span>
              <span className="font-mono">-{formatCurrency(quotation.discountAmount || 0, quotation.currency)}</span>
            </div>
          )}

          {quotation.isTaxEnabled && (
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Taxable</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(taxableAmount, quotation.currency)}
              </span>
            </div>
          )}

          {quotation.isTaxEnabled && quotation.taxBreakdown && (
            <>
              {quotation.taxBreakdown.map((t, i) => (
                <div key={i} className="flex justify-between text-slate-700">
                  <span>{t.name}</span>
                  <span className="font-mono">{formatCurrency(t.amount, quotation.currency)}</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t-2 border-b-2 border-slate-900 py-1 my-0.5 flex justify-between font-black text-xs sm:text-sm text-slate-900">
            <span>TOTAL</span>
            <span className="font-mono">{formatCurrency(quotation.totalAmount, quotation.currency)}</span>
          </div>

          {quotation.advanceAmount !== undefined && quotation.advanceAmount > 0 && (
            <div className="pt-1 mt-1 border-t border-dashed border-slate-300 space-y-0.5">
              <div className="flex justify-between text-[10px] text-emerald-800 font-bold">
                <span>
                  Booking Advance (
                  {quotation.advanceType === "percentage" && quotation.advanceValue
                    ? `${quotation.advanceValue}%`
                    : `${Math.round((quotation.advanceAmount / (quotation.totalAmount || 1)) * 100)}%`}
                  ):
                </span>
                <span className="font-mono">{formatCurrency(quotation.advanceAmount, quotation.currency)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Balance on Delivery:</span>
                <span className="font-mono text-slate-700">
                  {formatCurrency(Math.max(0, quotation.totalAmount - quotation.advanceAmount), quotation.currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. AMOUNT IN WORDS */}
      <div className="mb-3 print:mb-2 p-2.5 print:p-1.5 rounded-xl border border-slate-200 bg-slate-50/60">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
          AMOUNT IN WORDS
        </p>
        <p className="text-[11px] font-bold text-slate-900 mt-0.5">
          {numberToWords(quotation.totalAmount)}
        </p>
      </div>

      {/* 6. Terms & Conditions and Notes Box */}
      {(quotation.termsAndConditions || quotation.notes) && (
        <div className="mb-3 print:mb-2 p-3 print:p-2 rounded-xl border border-slate-200 bg-white space-y-2">
          {quotation.termsAndConditions && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-0.5">
                TERMS & CONDITIONS
              </p>
              <div className="whitespace-pre-line text-[11px] text-slate-600 leading-tight">
                {quotation.termsAndConditions}
              </div>
            </div>
          )}

          {quotation.notes && (
            <div className={quotation.termsAndConditions ? "pt-1.5 border-t border-slate-100" : ""}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-0.5">
                NOTES
              </p>
              <p className="text-[11px] text-slate-600 leading-tight whitespace-pre-line">
                {quotation.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. Payment Information & Authorized Signature Split */}
      <div className="mb-3 print:mb-2 grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden avoid-break">
        {/* Left: UPI Payment info for advance / booking */}
        <div className="p-3 print:p-2 space-y-1.5 bg-white flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
              PAYMENT INFORMATION
            </p>
            <div className="space-y-0.5 text-[11px] text-slate-700 mt-1">
              {upiId && (
                <p>
                  <span className="text-slate-500 font-medium">UPI ID:</span>{" "}
                  <span className="font-mono font-bold text-emerald-800">{upiId}</span>
                </p>
              )}
              {bankDetails.accountName && (
                <p>
                  <span className="text-slate-500 font-medium">A/C Name:</span>{" "}
                  <span className="font-semibold text-slate-900">{bankDetails.accountName}</span>
                </p>
              )}
              {bankDetails.bankName && (
                <p>
                  <span className="text-slate-500 font-medium">Bank:</span>{" "}
                  <span className="font-semibold text-slate-900">{bankDetails.bankName}</span>
                </p>
              )}
              {bankDetails.accountNumber && (
                <p>
                  <span className="text-slate-500 font-medium">A/C:</span>{" "}
                  <span className="font-mono font-bold text-slate-900">{bankDetails.accountNumber}</span>
                </p>
              )}
              {bankDetails.ifscCode && (
                <p>
                  <span className="text-slate-500 font-medium">IFSC:</span>{" "}
                  <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode}</span>
                </p>
              )}
            </div>
          </div>

          {upiId && (
            <div className="pt-1.5 flex items-center gap-2.5">
              <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0">
                <img
                  src={qrImageUrl}
                  alt="Scan to Pay Advance"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <p className="text-[9px] text-slate-500 font-medium leading-tight">
                Scan QR code for advance booking deposit
              </p>
            </div>
          )}
        </div>

        {/* Right: Authorized Signature */}
        <div className="p-3 print:p-2 bg-slate-50/40 flex flex-col justify-between items-end text-right">
          <p className="text-[10px] font-bold text-slate-700">
            For <span className="text-slate-900 font-extrabold">{tenant.businessName}</span>
          </p>

          <div className="h-12 print:h-10 flex items-end justify-end my-1">
            {signature ? (
              <img
                src={signature}
                alt="Authorized Digital Signature"
                className="max-h-11 max-w-[140px] object-contain"
              />
            ) : (
              <div className="h-8 w-40" />
            )}
          </div>

          <div className="w-40 border-b-2 border-slate-800" />
          <p className="text-[9px] font-extrabold text-slate-900 uppercase tracking-wider mt-0.5">
            Authorized Signature
          </p>
          {tenant.ownerName && (
            <p className="text-[9px] text-slate-500 font-medium">{tenant.ownerName}</p>
          )}
        </div>
      </div>

      {/* 8. Attribution Footer */}
      <div className="pt-2 print:pt-1 border-t border-slate-200 text-center space-y-0.5 avoid-break">
        <p className="text-[11px] font-semibold text-slate-700">
          Thank you for considering our services.
        </p>
        <p className="text-[9px] font-medium text-slate-400">
          Generated with BillEase
        </p>
      </div>
    </div>
  );
}
