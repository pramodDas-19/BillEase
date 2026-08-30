import React from "react";
import { Tenant } from "@/types";

interface DocumentHeaderProps {
  tenant: Tenant;
  documentTitle: "QUOTATION" | "TAX INVOICE" | "ESTIMATE" | "RECEIPT";
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
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
      {/* Business Info */}
      <div className="space-y-1 max-w-sm">
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
