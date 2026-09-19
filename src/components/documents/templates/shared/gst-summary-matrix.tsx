import React from "react";
import { formatCurrency } from "@/lib/utils";
import { NormalizedDocument } from "./template-adapter";

interface GstSummaryMatrixProps {
  doc: NormalizedDocument;
  theme?: "classic" | "tally" | "modern" | "compact";
}

export function GstSummaryMatrix({ doc, theme = "classic" }: GstSummaryMatrixProps) {
  if (!doc.isTaxEnabled || doc.taxBreakdown.length === 0) return null;

  const isInterState = doc.taxBreakdown.some((t) => t.isInterState);

  const borderClass =
    theme === "tally"
      ? "border border-black text-black"
      : "border border-slate-300 text-slate-800";
  const headerBgClass =
    theme === "tally"
      ? "bg-slate-100 font-bold"
      : theme === "modern"
      ? "bg-slate-50 font-bold text-slate-700"
      : "bg-amber-50/70 font-black text-slate-900";

  return (
    <div className="w-full mt-2 text-[10px] leading-tight">
      <table className={`w-full border-collapse ${borderClass}`}>
        <thead>
          <tr className={`${headerBgClass} text-center border-b ${borderClass}`}>
            <th className={`p-1 border-r ${borderClass} w-24`}>HSN/SAC</th>
            <th className={`p-1 border-r ${borderClass}`}>Taxable Value</th>
            {!isInterState ? (
              <>
                <th className={`p-1 border-r ${borderClass}`} colSpan={2}>
                  CGST
                </th>
                <th className={`p-1 border-r ${borderClass}`} colSpan={2}>
                  SGST
                </th>
              </>
            ) : (
              <th className={`p-1 border-r ${borderClass}`} colSpan={2}>
                IGST
              </th>
            )}
            <th className="p-1">Total Tax Amount</th>
          </tr>
          <tr className={`text-[9px] text-center border-b ${borderClass} bg-slate-50/50`}>
            <th className={`p-0.5 border-r ${borderClass}`}></th>
            <th className={`p-0.5 border-r ${borderClass}`}></th>
            {!isInterState ? (
              <>
                <th className={`p-0.5 border-r ${borderClass} w-10`}>Rate</th>
                <th className={`p-0.5 border-r ${borderClass} w-16`}>Amount</th>
                <th className={`p-0.5 border-r ${borderClass} w-10`}>Rate</th>
                <th className={`p-0.5 border-r ${borderClass} w-16`}>Amount</th>
              </>
            ) : (
              <>
                <th className={`p-0.5 border-r ${borderClass} w-12`}>Rate</th>
                <th className={`p-0.5 border-r ${borderClass} w-20`}>Amount</th>
              </>
            )}
            <th className="p-0.5"></th>
          </tr>
        </thead>
        <tbody>
          {doc.taxBreakdown.map((t, idx) => {
            const hsnList = doc.items
              .filter((i) => (i.taxRate || 0) === t.rate && i.hsnSacCode)
              .map((i) => i.hsnSacCode)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(", ") || "-";

            const cgstRate = Math.round((t.rate / 2) * 100) / 100;
            const sgstRate = cgstRate;

            return (
              <tr key={idx} className={`border-b ${borderClass} text-center`}>
                <td className={`p-1 border-r ${borderClass} font-mono text-left pl-2`}>{hsnList}</td>
                <td className={`p-1 border-r ${borderClass} text-right pr-2 font-mono`}>
                  {formatCurrency(t.taxableAmount)}
                </td>
                {!isInterState ? (
                  <>
                    <td className={`p-1 border-r ${borderClass} font-mono`}>{cgstRate}%</td>
                    <td className={`p-1 border-r ${borderClass} text-right pr-1 font-mono`}>
                      {formatCurrency(t.cgstAmount)}
                    </td>
                    <td className={`p-1 border-r ${borderClass} font-mono`}>{sgstRate}%</td>
                    <td className={`p-1 border-r ${borderClass} text-right pr-1 font-mono`}>
                      {formatCurrency(t.sgstAmount)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`p-1 border-r ${borderClass} font-mono`}>{t.rate}%</td>
                    <td className={`p-1 border-r ${borderClass} text-right pr-1 font-mono`}>
                      {formatCurrency(t.igstAmount)}
                    </td>
                  </>
                )}
                <td className="p-1 text-right pr-2 font-bold font-mono">
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={`font-black ${headerBgClass} text-right`}>
            <td className={`p-1 border-r ${borderClass} text-center`}>Total</td>
            <td className={`p-1 border-r ${borderClass} pr-2 font-mono`}>
              {formatCurrency(doc.subtotal - doc.discountAmount)}
            </td>
            {!isInterState ? (
              <>
                <td className={`p-1 border-r ${borderClass}`}></td>
                <td className={`p-1 border-r ${borderClass} pr-1 font-mono`}>
                  {formatCurrency(doc.taxBreakdown.reduce((s, t) => s + t.cgstAmount, 0))}
                </td>
                <td className={`p-1 border-r ${borderClass}`}></td>
                <td className={`p-1 border-r ${borderClass} pr-1 font-mono`}>
                  {formatCurrency(doc.taxBreakdown.reduce((s, t) => s + t.sgstAmount, 0))}
                </td>
              </>
            ) : (
              <>
                <td className={`p-1 border-r ${borderClass}`}></td>
                <td className={`p-1 border-r ${borderClass} pr-1 font-mono`}>
                  {formatCurrency(doc.taxBreakdown.reduce((s, t) => s + t.igstAmount, 0))}
                </td>
              </>
            )}
            <td className="p-1 pr-2 font-mono">{formatCurrency(doc.totalTax)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
