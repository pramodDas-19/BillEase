import React from "react";
import { Invoice, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";

interface InvoicePrintDocumentProps {
  invoice: Invoice;
  tenant: Tenant;
}

export function InvoicePrintDocument({ invoice, tenant }: InvoicePrintDocumentProps) {
  const hasQtyOrRate = invoice.items.some((item) => item.quantity !== undefined || item.rate !== undefined);

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none">
      {/* Header */}
      <DocumentHeader
        tenant={tenant}
        documentTitle="TAX INVOICE"
        documentNumber={invoice.invoiceNumber}
        date={formatDate(invoice.issueDate)}
        dueDateOrValidUntil={{
          label: "Due Date",
          value: formatDate(invoice.dueDate),
        }}
      />

      {/* Bill To */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To:</p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{invoice.clientName}</h3>
          {invoice.clientAddress && <p className="text-xs text-slate-600 mt-0.5">{invoice.clientAddress}</p>}
          <div className="text-xs text-slate-600 mt-1 space-y-0.5">
            {invoice.clientPhone && <p>Phone: {invoice.clientPhone}</p>}
            {invoice.clientEmail && <p>Email: {invoice.clientEmail}</p>}
            {invoice.clientGstin && <p className="font-medium">GSTIN: {invoice.clientGstin}</p>}
          </div>
        </div>

        {invoice.quotationNumber && (
          <div className="rounded-lg bg-slate-50/50 p-4 border border-slate-200/50 flex flex-col justify-center">
            <p className="text-xs text-slate-500">Origin Quotation Reference:</p>
            <p className="text-sm font-semibold text-slate-800">#{invoice.quotationNumber}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse text-left text-xs mb-6">
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-100">
            <th className="py-2.5 px-3 font-bold text-slate-800 w-10">#</th>
            <th className="py-2.5 px-3 font-bold text-slate-800">Description</th>
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
          {invoice.items.map((item, idx) => (
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
              {hasQtyOrRate && (
                <>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {item.quantity !== undefined ? `${item.quantity} ${item.unit || ""}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {item.rate !== undefined ? formatCurrency(item.rate, invoice.currency) : "—"}
                  </td>
                </>
              )}
              <td className="py-3 px-3 text-right font-semibold text-slate-900">
                {formatCurrency(item.amount, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations & Total */}
      <div className="flex justify-between items-start border-t-2 border-slate-800 pt-4">
        <div className="max-w-xs text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Amount in Words:</p>
          <p className="italic">{numberToWords(invoice.totalAmount)}</p>
        </div>

        <div className="w-64 space-y-1.5 text-xs text-right">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </span>
          </div>

          {Boolean(invoice.discountAmount && invoice.discountAmount > 0) && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.discountAmount || 0, invoice.currency)}</span>
            </div>
          )}

          {invoice.isTaxEnabled && invoice.taxBreakdown && (
            <>
              {invoice.taxBreakdown.map((t, i) => (
                <div key={i} className="flex justify-between text-slate-700">
                  <span>{t.name}:</span>
                  <span>+{formatCurrency(t.amount, invoice.currency)}</span>
                </div>
              ))}
            </>
          )}

          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
            <span>Total Amount:</span>
            <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>

          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Paid Amount:</span>
            <span>{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
          </div>

          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-extrabold text-slate-900">
            <span>Balance Due:</span>
            <span className="text-amber-700">{formatCurrency(invoice.balanceDue, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <DocumentFooter
        tenant={tenant}
        termsAndConditions={invoice.termsAndConditions}
        notes={invoice.notes}
      />
    </div>
  );
}
