import React from "react";
import { Invoice, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface InvoicePrintDocumentProps {
  invoice: Invoice;
  tenant: Tenant;
}

export function InvoicePrintDocument({ invoice, tenant }: InvoicePrintDocumentProps) {
  const hasQtyOrRate = invoice.items.some((item) => item.quantity !== undefined || item.rate !== undefined);
  const isFullyPaid = (invoice.balanceDue ?? 0) <= 0 || invoice.status === "paid";

  const bankDetails = tenant.bankDetails || {
    accountName: tenant.businessName,
    accountNumber: "50200012345678",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank (Sector 18 Branch)",
    upiId: "royalevents@hdfcbank",
  };

  const upiId = bankDetails.upiId || "royalevents@hdfcbank";

  // Generate dynamic QR code URL with invoice balance embedded
  const upiUri = generateUpiIntentUrl({
    upiId,
    businessName: tenant.businessName,
    amount: invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount,
    transactionRef: invoice.invoiceNumber,
    note: `Invoice ${invoice.invoiceNumber}`,
  });

  const qrImageUrl = getUpiQrImageUrl(upiUri, 200);

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 sm:p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none">
      {/* Header */}
      <DocumentHeader
        tenant={tenant}
        documentTitle={isFullyPaid ? "TAX INVOICE & RECEIPT" : "TAX INVOICE"}
        documentNumber={invoice.invoiceNumber}
        date={formatDate(invoice.issueDate)}
        dueDateOrValidUntil={{
          label: isFullyPaid ? "Settled On" : "Due Date",
          value: isFullyPaid ? formatDate(invoice.issueDate) : formatDate(invoice.dueDate),
        }}
      />

      {/* Top 2-Column Section: Left Billed To (with Quote Ref) | Right Bank & (Live QR or PAID Stamp) */}
      <div className="mb-4 print:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
        {/* Left: Billed To with Quote Ref */}
        <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 flex flex-col justify-between space-y-1.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Billed To:
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {invoice.clientName}
            </h3>
            {invoice.clientAddress && (
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {invoice.clientAddress}
              </p>
            )}
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
              {invoice.clientPhone && <p>Phone: {invoice.clientPhone}</p>}
              {invoice.clientEmail && <p>Email: {invoice.clientEmail}</p>}
              {invoice.clientGstin && <p className="font-semibold text-slate-800">GSTIN: {invoice.clientGstin}</p>}
            </div>
          </div>

          {/* Embedded Origin Quotation Reference Badge */}
          {invoice.quotationNumber && (
            <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="text-[10px] font-bold text-slate-400">Origin Quote Ref:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.2 rounded-md border border-slate-200 text-[10px]">
                #{invoice.quotationNumber}
              </span>
            </div>
          )}
        </div>

        {/* Right: Bank Details & Dynamic UPI QR or Official PAID Stamp */}
        <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200 flex items-center justify-between gap-2.5">
          <div className="space-y-0.5 text-xs text-slate-700 leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-1">
              Bank & Payment Details:
            </p>
            {bankDetails.accountName && (
              <p className="text-[11px]"><span className="text-slate-500 font-medium">A/C Name:</span> <span className="font-bold text-slate-900">{bankDetails.accountName}</span></p>
            )}
            {bankDetails.accountNumber && (
              <p className="text-[11px]"><span className="text-slate-500 font-medium">A/C No:</span> <span className="font-mono font-bold text-slate-900">{bankDetails.accountNumber}</span></p>
            )}
            {bankDetails.ifscCode && (
              <p className="text-[11px]"><span className="text-slate-500 font-medium">IFSC:</span> <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode}</span></p>
            )}
            {bankDetails.bankName && (
              <p className="text-[11px] text-slate-600">{bankDetails.bankName}</p>
            )}
            {upiId && (
              <p className="text-[11px] font-bold text-emerald-800 pt-0.5">
                UPI ID: <span className="font-mono">{upiId}</span>
              </p>
            )}
          </div>

          {/* Conditional: PAID Stamp IF Settled, ELSE Dynamic UPI QR */}
          {isFullyPaid ? (
            <div className="shrink-0 flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50/90 border-2 border-dashed border-emerald-600/80 text-center min-w-[105px] shadow-2xs">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-emerald-900 mt-1 uppercase tracking-wider">
                PAID IN FULL
              </span>
              <span className="text-[8px] font-extrabold text-emerald-700 uppercase tracking-tight">
                Settled Receipt ✅
              </span>
            </div>
          ) : (
            <div className="shrink-0 flex flex-col items-center justify-center p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
              <img
                src={qrImageUrl}
                alt="Scan to Pay UPI QR"
                className="h-18 w-18 object-contain"
              />
              <span className="text-[8px] font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
                Scan & Pay UPI
              </span>
              <span className="text-[7px] text-slate-400 font-medium">GPay • PhonePe</span>
            </div>
          )}
        </div>
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
            <span className={isFullyPaid ? "text-emerald-700 font-black" : "text-amber-700"}>
              {formatCurrency(invoice.balanceDue, invoice.currency)}
            </span>
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
