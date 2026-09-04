import React from "react";
import { Tenant } from "@/types";

interface DocumentHeaderProps {
  tenant: Tenant;
  documentTitle: "QUOTATION" | "TAX INVOICE" | "TAX INVOICE & RECEIPT" | "ESTIMATE" | "RECEIPT" | string;
  documentNumber: string;
  date: string;

  dueDateOrValidUntil?: {
    label: string;
    value: string;
  };
}

export function DocumentHeader({
  tenant,
  documentTitle,
  documentNumber,
  date,
  dueDateOrValidUntil,
}: DocumentHeaderProps) {
  const logo = tenant.logoUrl || tenant.settings?.logoUrl;
  const addressParts = [
    tenant.address?.street,
    tenant.address?.city,
    tenant.address?.state,
    tenant.address?.postalCode,
  ].filter(Boolean);

  const contactParts = [
    tenant.phone ? `Phone: ${tenant.phone}` : null,
    tenant.email ? `Email: ${tenant.email}` : null,
    tenant.gstin ? `GSTIN: ${tenant.gstin}` : null,
  ].filter(Boolean);

  return (
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 mb-3 print:pb-2 print:mb-2">
      {/* Left: Business Logo & Identity */}
      <div className="max-w-md space-y-1">
        {logo ? (
          <div className="mb-3 print:mb-2.5">
            <img
              src={logo}
              alt={tenant.businessName}
              className="h-16 sm:h-20 w-auto max-w-[240px] object-contain object-left print:h-16"
            />
          </div>
        ) : (
          <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs mb-2.5">
            {tenant.businessName ? tenant.businessName.charAt(0).toUpperCase() : "B"}
          </div>
        )}

        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {tenant.businessName}
          </h1>

          {addressParts.length > 0 && (
            <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
              {addressParts.join(", ")}
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
          {documentTitle}
        </h2>
        <p className="text-sm font-extrabold text-slate-800 font-mono">
          #{documentNumber}
        </p>
        <p className="text-[11px] text-slate-600 font-medium">
          Date: <span className="font-bold text-slate-800">{date}</span>
        </p>
        {dueDateOrValidUntil && (
          <p className="text-[11px] text-slate-600 font-medium">
            {dueDateOrValidUntil.label}:{" "}
            <span className="font-bold text-slate-800">{dueDateOrValidUntil.value}</span>
          </p>
        )}
      </div>
    </div>
  );
}
