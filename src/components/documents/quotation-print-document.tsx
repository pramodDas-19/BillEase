import React from "react";
import { Quotation, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";

interface QuotationPrintDocumentProps {
  quotation: Quotation;
  tenant: Tenant;
}

export function QuotationPrintDocument({ quotation, tenant }: QuotationPrintDocumentProps) {
  const hasQtyOrRate = quotation.items.some((item) => item.quantity !== undefined || item.rate !== undefined);
  const hasHsnSac = quotation.items.some((item) => Boolean(item.hsnSacCode));

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none">
      {/* Header */}
      <DocumentHeader
        tenant={tenant}
        documentTitle={quotation.isTaxEnabled ? "PRICE QUOTATION & GST ESTIMATE" : "QUOTATION"}
        documentNumber={quotation.quotationNumber}
        date={formatDate(quotation.date)}
        dueDateOrValidUntil={{
          label: "Valid Until",
          value: formatDate(quotation.validUntil),
        }}
      />

      {/* Client Information */}
      <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200/80">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quotation For:</p>
        <h3 className="text-base font-bold text-slate-900 mt-0.5">{quotation.clientName}</h3>
        {quotation.clientAddress && <p className="text-xs text-slate-600 mt-0.5">{quotation.clientAddress}</p>}
        <div className="flex gap-4 text-xs text-slate-600 mt-1">
          {quotation.clientPhone && <span>Phone: {quotation.clientPhone}</span>}
          {quotation.clientEmail && <span>Email: {quotation.clientEmail}</span>}
          {quotation.clientGstin && <span className="font-semibold text-slate-800">GSTIN: {quotation.clientGstin}</span>}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse text-left text-xs mb-6">
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-100">
            <th className="py-2.5 px-3 font-bold text-slate-800 w-10">#</th>
            <th className="py-2.5 px-3 font-bold text-slate-800">Description & Scope</th>
            {hasHsnSac && (
              <th className="py-2.5 px-3 font-bold text-slate-800 text-center w-20">HSN/SAC</th>
            )}
            {hasQtyOrRate && (
              <>
                <th className="py-2.5 px-3 font-bold text-slate-800 text-center w-20">Qty</th>
                <th className="py-2.5 px-3 font-bold text-slate-800 text-right w-24">Rate</th>
              </>
            )}
            <th className="py-2.5 px-3 font-bold text-slate-800 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {quotation.items.map((item, idx) => (
            <tr key={item.id} className="align-top">
              <td className="py-3 px-3 text-slate-500 font-medium">{idx + 1}</td>
              <td className="py-3 px-3">
                <p className="font-semibold text-slate-900">{item.description}</p>
                {item.detailedNotes && (
                  <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {item.detailedNotes}
                  </p>
                )}
              </td>
              {hasHsnSac && (
                <td className="py-3 px-3 text-center font-mono font-semibold text-[11px] text-slate-700">
                  {item.hsnSacCode || "—"}
                </td>
              )}

              {hasQtyOrRate && (
                <>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {item.quantity !== undefined ? `${item.quantity} ${item.unit || ""}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {item.rate !== undefined ? formatCurrency(item.rate, quotation.currency) : "—"}
                  </td>
                </>
              )}
              <td className="py-3 px-3 text-right font-semibold text-slate-900">
                {formatCurrency(item.amount, quotation.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations & Total */}
      <div className="flex justify-between items-start border-t-2 border-slate-800 pt-4">
        <div className="max-w-xs text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Amount in Words:</p>
          <p className="italic">{numberToWords(quotation.totalAmount)}</p>
        </div>

        <div className="w-64 space-y-1.5 text-xs text-right">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(quotation.subtotal, quotation.currency)}
            </span>
          </div>

          {Boolean(quotation.discountAmount && quotation.discountAmount > 0) && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span>-{formatCurrency(quotation.discountAmount || 0, quotation.currency)}</span>
            </div>
          )}

          {quotation.isTaxEnabled && quotation.taxBreakdown && (
            <>
              {quotation.taxBreakdown.map((t, i) => (
                <div key={i} className="flex justify-between text-slate-700">
                  <span>{t.name}:</span>
                  <span>+{formatCurrency(t.amount, quotation.currency)}</span>
                </div>
              ))}
            </>
          )}

          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-slate-900">
            <span>Grand Total:</span>
            <span>{formatCurrency(quotation.totalAmount, quotation.currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <DocumentFooter
        tenant={tenant}
        termsAndConditions={quotation.termsAndConditions}
        notes={quotation.notes}
      />
    </div>
  );
}
