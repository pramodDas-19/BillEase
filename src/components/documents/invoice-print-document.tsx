import React from "react";
import { Invoice, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";
import { CheckCircle2 } from "lucide-react";

interface InvoicePrintDocumentProps {
  invoice: Invoice;
  tenant: Tenant;
}

export function InvoicePrintDocument({ invoice, tenant }: InvoicePrintDocumentProps) {
  const hasQtyOrRate = invoice.items.some((item) => item.quantity !== undefined || item.rate !== undefined);
  const hasHsnSac = invoice.items.some((item) => Boolean(item.hsnSacCode));
  const isFullyPaid = (invoice.balanceDue ?? 0) <= 0 || invoice.status === "paid";
  const taxableAmount = Math.max(0, (invoice.subtotal || 0) - (invoice.discountAmount || 0));
  const fallbackTaxRate = invoice.taxBreakdown && invoice.taxBreakdown.length > 0
    ? Math.round(invoice.taxBreakdown.reduce((sum, t) => sum + (t.rate || 0), 0) * 100) / 100
    : (invoice.defaultTaxRate || 18);
  const totalItemDiscounts = invoice.items.reduce((acc, it) => {
    const dAmt = (it.discountAmount !== undefined && it.discountAmount > 0)
      ? it.discountAmount
      : (it.discountValue && it.discountValue > 0
          ? (it.discountType === "fixed"
              ? it.discountValue
              : Math.round(((it.amount * it.discountValue) / Math.max(1, 100 - it.discountValue)) * 100) / 100)
          : 0);
    return acc + dAmt;
  }, 0);

  const bankDetails = tenant?.bankDetails || {
    accountName: tenant?.businessName || "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  };

  const upiId = bankDetails.upiId || "";

  // Generate dynamic QR code URL with invoice balance embedded
  const upiUri = generateUpiIntentUrl({
    upiId: upiId || "business@upi",
    businessName: tenant?.businessName || "Business",
    amount: invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount,
    transactionRef: invoice.invoiceNumber,
    note: `Invoice ${invoice.invoiceNumber}`,
  });

  const qrImageUrl = getUpiQrImageUrl(upiUri, 220);

  return (
    <div className="mx-auto max-w-4xl bg-white p-4 sm:p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none print:max-w-none text-xs">
      {/* 1. Header */}
      <DocumentHeader
        tenant={tenant}
        documentTitle={
          !invoice.isTaxEnabled
            ? "INVOICE"
            : isFullyPaid
            ? "TAX INVOICE & RECEIPT"
            : "TAX INVOICE"
        }
        documentNumber={invoice.invoiceNumber}
        date={formatDate(invoice.issueDate)}
        dueDateOrValidUntil={{
          label: isFullyPaid ? "Settled On" : "Due",
          value: isFullyPaid ? formatDate(invoice.issueDate) : formatDate(invoice.dueDate),
        }}
      />

      {/* 2. BILL TO Box */}
      <div className="mb-3 print:mb-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
          BILL TO
        </p>
        <div className="rounded-xl border border-slate-300 p-2.5 print:p-2 space-y-0.5 bg-white">
          <h3 className="text-xs sm:text-sm font-black text-slate-900">{invoice.clientName}</h3>
          {invoice.clientCompanyName && (
            <p className="text-xs font-extrabold text-slate-800 tracking-tight">
              {invoice.clientCompanyName}
            </p>
          )}
          {invoice.clientAddress && (
            <p className="text-[11px] text-slate-600 leading-tight">{invoice.clientAddress}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 pt-0.5">
            {invoice.clientPhone && <span>Phone: {invoice.clientPhone}</span>}
            {invoice.clientEmail && <span>Email: {invoice.clientEmail}</span>}
            {invoice.clientGstin && (
              <span className="font-bold text-slate-800">GSTIN: {invoice.clientGstin}</span>
            )}
            {invoice.clientPan && (
              <span className="font-bold text-slate-800">PAN: {invoice.clientPan}</span>
            )}
          </div>
          {invoice.quotationNumber && (
            <div className="pt-1.5 mt-0.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Origin Quotation Ref:
              </span>
              <span className="font-bold text-slate-800 font-mono">
                #{invoice.quotationNumber}
              </span>
            </div>
          )}
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
          {invoice.items.map((item, idx) => {
            const itDiscAmt = (item.discountAmount !== undefined && item.discountAmount > 0)
              ? item.discountAmount
              : (item.discountValue && item.discountValue > 0
                  ? (item.discountType === "fixed"
                      ? item.discountValue
                      : Math.round(((item.amount * item.discountValue) / Math.max(1, 100 - item.discountValue)) * 100) / 100)
                  : 0);

            const itemTaxRate = (item.taxRate !== undefined && item.taxRate !== null)
              ? item.taxRate
              : fallbackTaxRate;

            return (
              <tr key={item.id} className="align-top">
                <td className="py-2 px-2.5 text-center text-slate-500 font-bold font-mono text-[11px]">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="py-2 px-2.5">
                  <p className="font-bold text-slate-900">
                    {item.description}
                    {invoice.isTaxEnabled && itemTaxRate !== undefined && (
                      <span className="text-[10px] font-semibold text-slate-500 ml-1.5 font-sans">
                        (GST {itemTaxRate}%)
                      </span>
                    )}
                  </p>
                  {Boolean(item.discountValue && item.discountValue > 0) && (
                    <div className="mt-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🏷️ Includes {item.discountValue}{item.discountType === "fixed" ? " ₹" : "%"} discount
                        {itDiscAmt > 0 ? ` (-${formatCurrency(itDiscAmt, invoice.currency)})` : ""}
                      </span>
                    </div>
                  )}
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
                      {item.rate !== undefined ? formatCurrency(item.rate, invoice.currency) : "—"}
                    </td>
                  </>
                )}
                <td className="py-2 px-2.5 text-right font-mono">
                  {Boolean(item.discountValue && item.discountValue > 0 && itDiscAmt > 0) ? (
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block font-normal">
                        {formatCurrency(item.amount + itDiscAmt, invoice.currency)}
                      </span>
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(item.amount, invoice.currency)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 font-sans block">
                        (-{item.discountValue}{item.discountType === "fixed" ? "₹" : "%"} off)
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.amount, invoice.currency)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. Calculations Block */}
      <div className="flex justify-end mb-3 print:mb-2">
        <div className="w-64 space-y-1 text-xs text-right">
          {totalItemDiscounts > 0 ? (
            <>
              <div className="flex justify-between text-slate-500">
                <span>Original Total</span>
                <span className="font-mono line-through">
                  {formatCurrency(invoice.subtotal + totalItemDiscounts, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Item Discounts</span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(totalItemDiscounts, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Net Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
          )}

          {Boolean(invoice.discountAmount && invoice.discountAmount > 0) && (
            <div className="flex justify-between text-rose-600">
              <span className="font-medium">Discount</span>
              <span className="font-mono">-{formatCurrency(invoice.discountAmount || 0, invoice.currency)}</span>
            </div>
          )}

          {invoice.isTaxEnabled && (
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Taxable</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(taxableAmount, invoice.currency)}
              </span>
            </div>
          )}

          {invoice.isTaxEnabled && invoice.taxBreakdown && (
            <>
              {invoice.taxBreakdown.map((t, i) => (
                <div key={i} className="flex justify-between text-slate-700">
                  <span>{t.name}</span>
                  <span className="font-mono">{formatCurrency(t.amount, invoice.currency)}</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t-2 border-b-2 border-slate-900 py-1 my-0.5 flex justify-between font-black text-xs sm:text-sm text-slate-900">
            <span>TOTAL</span>
            <span className="font-mono">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>

          <div className="flex justify-between text-slate-700 font-medium pt-0.5">
            <span>Amount Paid</span>
            <span className="font-mono font-semibold">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
          </div>

          <div className="flex justify-between font-extrabold text-slate-900">
            <span>Balance Due</span>
            <span className={isFullyPaid ? "text-emerald-700 font-black font-mono" : "text-amber-700 font-black font-mono"}>
              {formatCurrency(invoice.balanceDue, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. AMOUNT IN WORDS */}
      <div className="mb-3 print:mb-2 p-2.5 print:p-1.5 rounded-xl border border-slate-200 bg-slate-50/60">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
          AMOUNT IN WORDS
        </p>
        <p className="text-[11px] font-bold text-slate-900 mt-0.5">
          {numberToWords(invoice.totalAmount)}
        </p>
      </div>

      {/* 6. Payment Information & Pay Online Split Section */}
      <div className="mb-3 print:mb-2 grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden avoid-break">
        {/* Left: Bank Details */}
        <div className="p-3 print:p-2 space-y-1.5 bg-white">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
            PAYMENT INFORMATION
          </p>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            {bankDetails.bankName && (
              <p><span className="text-slate-500 font-medium">Bank:</span> <span className="font-bold text-slate-900">{bankDetails.bankName}</span></p>
            )}
            {bankDetails.accountName && (
              <p><span className="text-slate-500 font-medium">A/C Name:</span> <span className="font-bold text-slate-900">{bankDetails.accountName}</span></p>
            )}
            {bankDetails.accountNumber && (
              <p><span className="text-slate-500 font-medium">A/C:</span> <span className="font-mono font-bold text-slate-900">{bankDetails.accountNumber}</span></p>
            )}
            {bankDetails.ifscCode && (
              <p><span className="text-slate-500 font-medium">IFSC:</span> <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode}</span></p>
            )}
            {upiId && (
              <p><span className="text-slate-500 font-medium">UPI:</span> <span className="font-mono font-bold text-emerald-800">{upiId}</span></p>
            )}
          </div>
        </div>

        {/* Right: Pay Online Dynamic Vector QR / Paid Stamp */}
        <div className="p-3 print:p-2 flex flex-col items-center justify-center bg-slate-50/50 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-1">
            PAY ONLINE
          </p>
          {isFullyPaid ? (
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 border-2 border-dashed border-emerald-600 text-center min-w-[120px]">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-0.5" />
              <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                PAID IN FULL
              </span>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">
                Receipt Settled
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt="Scan to Pay UPI QR"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <p className="text-[10px] font-extrabold text-slate-900 mt-1 font-mono">
                Scan to pay {formatCurrency(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount, invoice.currency)}
              </p>
              <p className="text-[8px] text-slate-400 font-medium">
                Accepts GPay, PhonePe, Paytm, BHIM
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Footer: Terms, Notes, Authorized Signature & BillEase Attribution */}
      <DocumentFooter
        tenant={tenant}
        termsAndConditions={invoice.termsAndConditions}
        notes={invoice.notes}
        footerTagline="Powered by BillEase"
      />
    </div>
  );
}
