import { CurrencyCode, TaxBreakdown } from "./common.types";

export type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid" | "due" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  detailedNotes?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  tenantId: string; // Multi-tenant isolation
  invoiceNumber: string; // e.g. "INV-2026-001"
  quotationId?: string; // Optional quotation origin ID
  quotationNumber?: string;

  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;

  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;

  currency: CurrencyCode;
  items: InvoiceLineItem[];

  // Calculation fields
  subtotal: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;

  // GST / Tax (OPTIONAL)
  isTaxEnabled: boolean;
  taxBreakdown?: TaxBreakdown[];
  totalTax: number;

  totalAmount: number;
  paidAmount: number;
  balanceDue: number;

  termsAndConditions?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}
