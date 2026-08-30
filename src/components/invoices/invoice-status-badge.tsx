import React from "react";
import { InvoiceStatus } from "@/types";
import { INVOICE_STATUSES } from "@/constants/status-types";
import { Badge } from "@/components/ui/badge";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = INVOICE_STATUSES[status] || INVOICE_STATUSES.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
