import { CurrencyCode, PaymentMethod } from "./common.types";

export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenantId: string; // Multi-tenant isolation
  paymentNumber: string; // e.g. "PAY-2026-001"
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;

  amount: number;
  currency: CurrencyCode;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionReference?: string; // Cheque No, UPI Ref / UTR, Bank Txn ID
  notes?: string;
  receiptUrl?: string;

  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
