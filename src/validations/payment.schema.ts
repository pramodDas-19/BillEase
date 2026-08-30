import { Payment } from "@/types";

export type PaymentFormData = Omit<Payment, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validatePayment(data: Partial<PaymentFormData>, maxAllowed?: number): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.invoiceId) {
    errors.invoiceId = "Invoice is required";
  }

  if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.amount = "Payment amount must be greater than zero";
  } else if (maxAllowed !== undefined && Number(data.amount) > maxAllowed) {
    errors.amount = `Amount cannot exceed balance due of ${maxAllowed}`;
  }

  if (!data.paymentDate) {
    errors.paymentDate = "Payment date is required";
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = "Payment method is required";
  }

  return errors;
}
