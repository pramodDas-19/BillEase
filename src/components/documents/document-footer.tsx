import React from "react";
import { Tenant } from "@/types";

interface DocumentFooterProps {
  tenant: Tenant;
  termsAndConditions?: string;
  notes?: string;
  signatoryLabel?: string;
}

export function DocumentFooter({
  tenant,
  termsAndConditions,
  notes,
  signatoryLabel = "Authorized Signatory",
}: DocumentFooterProps) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200 space-y-6 text-xs text-slate-700">
      <div className="grid grid-cols-2 gap-8">
        {/* Terms & Notes / Bank Details */}
        <div className="space-y-4">
          {tenant.bankDetails && (
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1 text-[11px]">
              <p className="font-bold text-slate-900">Bank & Payment Details:</p>
              {tenant.bankDetails.accountName && <p>A/C Name: {tenant.bankDetails.accountName}</p>}
              {tenant.bankDetails.accountNumber && <p>A/C No: {tenant.bankDetails.accountNumber}</p>}
              {tenant.bankDetails.ifscCode && <p>IFSC: {tenant.bankDetails.ifscCode}</p>}
              {tenant.bankDetails.bankName && (
                <p>
                  Bank: {tenant.bankDetails.bankName} {tenant.bankDetails.branch && `(${tenant.bankDetails.branch})`}
                </p>
              )}
              {tenant.bankDetails.upiId && (
                <p className="font-semibold text-emerald-800">UPI ID: {tenant.bankDetails.upiId}</p>
              )}
            </div>
          )}

          {termsAndConditions && (
            <div>
              <p className="font-bold text-slate-900 mb-1">Terms & Conditions:</p>
              <p className="whitespace-pre-line text-slate-600 leading-relaxed text-[11px]">
                {termsAndConditions}
              </p>
            </div>
          )}

          {notes && (
            <div>
              <p className="font-semibold text-slate-800">Notes:</p>
              <p className="text-slate-600 text-[11px]">{notes}</p>
            </div>
          )}
        </div>

        {/* Signature Box */}
        <div className="flex flex-col justify-end items-end text-right space-y-12">
          <p className="font-medium text-slate-800">For {tenant.businessName}</p>
          <div className="border-t border-slate-400 pt-2 w-48 text-center text-[11px] font-semibold text-slate-700">
            {signatoryLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
