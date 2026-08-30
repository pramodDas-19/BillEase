import { QuotationStatus, InvoiceStatus, PaymentStatus } from "@/types";

export interface StatusBadgeConfig {
  label: string;
  variant: "default" | "secondary" | "success" | "warning" | "danger" | "info";
  bgClass: string;
  textClass: string;
}

export const QUOTATION_STATUSES: Record<QuotationStatus, StatusBadgeConfig> = {
  draft: { label: "Draft", variant: "secondary", bgClass: "bg-slate-100", textClass: "text-slate-700" },
  sent: { label: "Sent", variant: "info", bgClass: "bg-blue-50", textClass: "text-blue-700" },
  viewed: { label: "Viewed", variant: "info", bgClass: "bg-indigo-50", textClass: "text-indigo-700" },
  accepted: { label: "Accepted", variant: "success", bgClass: "bg-emerald-50", textClass: "text-emerald-700" },
  rejected: { label: "Rejected", variant: "danger", bgClass: "bg-rose-50", textClass: "text-rose-700" },
  converted: { label: "Converted to Invoice", variant: "success", bgClass: "bg-teal-50", textClass: "text-teal-700" },
  expired: { label: "Expired", variant: "warning", bgClass: "bg-amber-50", textClass: "text-amber-700" },
};

export const INVOICE_STATUSES: Record<InvoiceStatus, StatusBadgeConfig> = {
  draft: { label: "Draft", variant: "secondary", bgClass: "bg-slate-100", textClass: "text-slate-700" },
  sent: { label: "Sent", variant: "info", bgClass: "bg-blue-50", textClass: "text-blue-700" },
  paid: { label: "Paid", variant: "success", bgClass: "bg-emerald-50", textClass: "text-emerald-700" },
  partially_paid: { label: "Partially Paid", variant: "warning", bgClass: "bg-amber-50", textClass: "text-amber-700" },
  due: { label: "Due", variant: "warning", bgClass: "bg-orange-50", textClass: "text-orange-700" },
  overdue: { label: "Overdue", variant: "danger", bgClass: "bg-rose-50", textClass: "text-rose-700" },
  cancelled: { label: "Cancelled", variant: "secondary", bgClass: "bg-slate-100", textClass: "text-slate-500" },
};

export const PAYMENT_STATUSES: Record<PaymentStatus, StatusBadgeConfig> = {
  completed: { label: "Completed", variant: "success", bgClass: "bg-emerald-50", textClass: "text-emerald-700" },
  pending: { label: "Pending", variant: "warning", bgClass: "bg-amber-50", textClass: "text-amber-700" },
  failed: { label: "Failed", variant: "danger", bgClass: "bg-rose-50", textClass: "text-rose-700" },
  refunded: { label: "Refunded", variant: "secondary", bgClass: "bg-slate-100", textClass: "text-slate-700" },
};
