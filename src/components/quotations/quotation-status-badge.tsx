import React from "react";
import { QuotationStatus } from "@/types";
import { QUOTATION_STATUSES } from "@/constants/status-types";
import { Badge } from "@/components/ui/badge";

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const config = QUOTATION_STATUSES[status] || QUOTATION_STATUSES.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
