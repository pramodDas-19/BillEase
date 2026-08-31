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
  return (
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4 print:pb-3 print:mb-3">

      {/* Business Info */}
      <div className="flex items-start gap-3.5 max-w-md">
        {tenant.logoUrl && (
          <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200">
            <img
              src={tenant.logoUrl}
              alt={tenant.businessName}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {tenant.businessName}
          </h1>

          {tenant.address && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {[tenant.address.street, tenant.address.city, tenant.address.state, tenant.address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <p className="text-xs text-slate-600">
            Phone: {tenant.phone} {tenant.email && `| Email: ${tenant.email}`}
          </p>
          {tenant.gstin && (
            <p className="text-xs font-semibold text-slate-800">GSTIN: {tenant.gstin}</p>
          )}
        </div>
      </div>


      {/* Document Details */}
      <div className="text-right space-y-1">
        <h2 className="text-2xl font-extrabold tracking-wider text-slate-900">{documentTitle}</h2>
        <p className="text-sm font-bold text-slate-800">#{documentNumber}</p>
        <p className="text-xs text-slate-600">Date: {date}</p>
        {dueDateOrValidUntil && (
          <p className="text-xs font-medium text-slate-700">
            {dueDateOrValidUntil.label}: {dueDateOrValidUntil.value}
          </p>
        )}
      </div>
    </div>
  );
}
