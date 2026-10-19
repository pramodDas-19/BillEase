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
    errors[`items.${index}.amount`] = "Valid non-negative amount is required";
  }

  if (item.quantity !== undefined && (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
    errors[`items.${index}.quantity`] = "Quantity must be greater than zero";
  }

  if (item.rate !== undefined && (isNaN(Number(item.rate)) || Number(item.rate) < 0)) {
    errors[`items.${index}.rate`] = "Rate cannot be negative";
  }

  if (item.discountValue !== undefined && Number(item.discountValue) > 0) {
    if (item.discountType === "percentage" && Number(item.discountValue) > 100) {
      errors[`items.${index}.discountValue`] = "Discount percentage cannot exceed 100%";
    } else if (Number(item.discountValue) < 0) {
      errors[`items.${index}.discountValue`] = "Discount cannot be negative";
    }
  }

  return errors;
}

export function validateQuotation(data: Partial<QuotationFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.quotationNumber?.trim()) {
    errors.quotationNumber = "Quotation number is required";
  }

  if (!data.clientId?.trim() && !data.clientName?.trim()) {
    errors.clientId = "Please select or add a client";
  }

  if (!data.date) {
    errors.date = "Issue date is required";
  }

  if (!data.validUntil) {
    errors.validUntil = "Validity date is required";
  } else if (data.date && new Date(data.validUntil).getTime() < new Date(data.date).getTime()) {
    errors.validUntil = "Validity date cannot precede the issue date";
  }

  if (!data.items || data.items.length === 0) {
    errors.items = "At least one line item is required";
  } else {
    data.items.forEach((item, index) => {
      Object.assign(errors, validateQuotationLineItem(item, index));
    });
  }

  // Advance booking token validation
  if (data.advanceType === "percentage" && data.advanceValue !== undefined) {
    if (Number(data.advanceValue) < 0 || Number(data.advanceValue) > 100) {
      errors.advanceValue = "Advance percentage must be between 0% and 100%";
    }
  } else if (data.advanceType === "fixed" && data.advanceAmount !== undefined) {
    if (Number(data.advanceAmount) < 0) {
      errors.advanceAmount = "Advance amount cannot be negative";
    } else if (data.totalAmount !== undefined && Number(data.advanceAmount) > Number(data.totalAmount)) {
      errors.advanceAmount = "Advance amount cannot exceed quotation total";
    }
  }

  // Overall discount validation
  if (data.discountValue !== undefined && Number(data.discountValue) > 0) {
    if (data.discountType === "percentage" && Number(data.discountValue) > 100) {
      errors.discountValue = "Discount percentage cannot exceed 100%";
    } else if (Number(data.discountValue) < 0) {
      errors.discountValue = "Discount cannot be negative";
    }
  }

  return errors;
}

