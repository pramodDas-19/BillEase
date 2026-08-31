import React from "react";
import { Tenant } from "@/types";

interface DocumentFooterProps {
  tenant: Tenant;
  termsAndConditions?: string;
  notes?: string;
}

export function DocumentFooter({
  termsAndConditions,
  notes,
}: DocumentFooterProps) {
  if (!termsAndConditions && !notes) return null;

  return (
    <div className="mt-8 pt-5 border-t border-slate-200 space-y-4 text-xs text-slate-700">
      {termsAndConditions && (
        <div>
          <p className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[10px]">
            Terms & Conditions:
          </p>
          <p className="whitespace-pre-line text-slate-600 leading-relaxed text-[11px]">
            {termsAndConditions}
          </p>
        </div>
      )}

      {notes && (
        <div className="pt-2 border-t border-slate-100">
          <p className="font-bold text-slate-900 mb-0.5 text-[10px] uppercase tracking-wider">
            Notes / Remarks:
          </p>
          <p className="text-slate-600 text-[11px] leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}
