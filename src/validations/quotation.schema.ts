import { Quotation, QuotationLineItem } from "@/types";

export type QuotationFormData = Omit<
  Quotation,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "convertedToInvoiceId" | "convertedAt"
>;

export function validateQuotationLineItem(item: Partial<QuotationLineItem>, index: number): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!item.description || !item.description.trim()) {
    errors[`items.${index}.description`] = "Description is required";
  }

  if (item.amount === undefined || isNaN(Number(item.amount)) || Number(item.amount) < 0) {
    errors[`items.${index}.amount`] = "Valid amount is required";
  }

  return errors;
}

export function validateQuotation(data: Partial<QuotationFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.quotationNumber?.trim()) {
    errors.quotationNumber = "Quotation number is required";
  }

  if (!data.clientId?.trim()) {
    errors.clientId = "Please select or add a client";
  }

  if (!data.date) {
    errors.date = "Issue date is required";
  }

  if (!data.validUntil) {
    errors.validUntil = "Validity date is required";
  }

  if (!data.items || data.items.length === 0) {
    errors.items = "At least one line item is required";
  } else {
    data.items.forEach((item, index) => {
      Object.assign(errors, validateQuotationLineItem(item, index));
    });
  }

  return errors;
}
