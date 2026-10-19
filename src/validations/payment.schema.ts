import { Payment, PaymentMethod } from "@/types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "upi",
  "bank_transfer",
  "cash",
  "cheque",
  "card",
  "online",
  "other",
];

export type PaymentFormData = Omit<Payment, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validatePayment(data: Partial<PaymentFormData>, maxAllowed?: number): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.invoiceId?.trim()) {
    errors.invoiceId = "Invoice is required";
  }

  const numAmount = Number(data.amount);
  if (data.amount === undefined || data.amount === null || isNaN(numAmount) || numAmount <= 0) {
    errors.amount = "Payment amount must be greater than zero";
  } else if (maxAllowed !== undefined && numAmount > maxAllowed + 0.001) {
    errors.amount = `Amount cannot exceed balance due of ₹${maxAllowed.toLocaleString("en-IN")}`;
  }

  if (!data.paymentDate?.trim()) {
    errors.paymentDate = "Payment date is required";
  } else if (isNaN(new Date(data.paymentDate).getTime())) {
    errors.paymentDate = "Valid payment date is required";
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = "Payment method is required";
  } else if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
    errors.paymentMethod = "Valid payment method is required";
  }

  if (data.transactionReference && data.transactionReference.length > 100) {
    errors.transactionReference = "Reference cannot exceed 100 characters";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "Notes cannot exceed 500 characters";
  }

  return errors;
}

export function isPaymentValid(data: Partial<PaymentFormData>, maxAllowed?: number): boolean {
  return Object.keys(validatePayment(data, maxAllowed)).length === 0;
}
