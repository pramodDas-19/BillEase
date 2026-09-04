import React from "react";
import { Tenant } from "@/types";

interface DocumentFooterProps {
  tenant: Tenant;
  termsAndConditions?: string;
  notes?: string;
  showSignature?: boolean;
  footerTagline?: string;
}

export function DocumentFooter({
  tenant,
  termsAndConditions,
  notes,
  showSignature = true,
  footerTagline = "Powered by BillEase",
}: DocumentFooterProps) {
  const signature = tenant.signatureUrl || tenant.settings?.signatureUrl;

  return (
    <div className="mt-3.5 pt-2.5 print:mt-2 print:pt-1.5 border-t-2 border-slate-900 space-y-3 print:space-y-2 text-xs text-slate-700 avoid-break">
      {/* 2-Column: Left Terms & Notes | Right Authorized Signatory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        {/* Left: Terms & Conditions and Notes */}
        <div className="space-y-2">
          {termsAndConditions && (
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-0.5">
                Terms & Conditions
              </p>
              <div className="whitespace-pre-line text-slate-600 leading-tight text-[11px]">
                {termsAndConditions}
              </div>
            </div>
          )}

          {notes && (
            <div className={termsAndConditions ? "pt-1.5 border-t border-slate-200" : ""}>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-0.5">
                Notes
              </p>
              <p className="text-slate-600 text-[11px] leading-tight whitespace-pre-line">
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Authorized Signature */}
        {showSignature && (
          <div className="flex flex-col items-end text-right sm:ml-auto">
            <p className="text-[10px] font-bold text-slate-700 mb-0.5">
              For <span className="text-slate-900 font-extrabold">{tenant.businessName}</span>
            </p>

            <div className="h-12 print:h-10 flex items-end justify-end mb-1">
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
        )}
      </div>

      {/* Centered Bottom Attribution Banner */}
      <div className="pt-2 print:pt-1 border-t border-slate-200 text-center space-y-0.5">
        <p className="text-[11px] font-semibold text-slate-700">
          Thank you for your business.
        </p>
        <p className="text-[9px] font-medium text-slate-400">
          {footerTagline}
        </p>
      </div>
    </div>
  );
}
