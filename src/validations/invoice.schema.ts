import { Invoice, InvoiceLineItem } from "@/types";

export type InvoiceFormData = Omit<Invoice, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validateInvoiceLineItem(item: Partial<InvoiceLineItem>, index: number): Record<string, string> {
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

export function validateInvoice(data: Partial<InvoiceFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.invoiceNumber?.trim()) {
    errors.invoiceNumber = "Invoice number is required";
  }

  if (!data.clientId?.trim() && !data.clientName?.trim()) {
    errors.clientId = "Please select or add a client";
  }

  if (!data.issueDate) {
    errors.issueDate = "Issue date is required";
  }

  if (!data.dueDate) {
    errors.dueDate = "Due date is required";
  } else if (data.issueDate && new Date(data.dueDate).getTime() < new Date(data.issueDate).getTime()) {
    errors.dueDate = "Due date cannot precede the issue date";
  }

  if (!data.items || data.items.length === 0) {
    errors.items = "At least one line item is required";
  } else {
    data.items.forEach((item, index) => {
      Object.assign(errors, validateInvoiceLineItem(item, index));
    });
  }

  // Paid amount validation
  if (data.paidAmount !== undefined) {
    if (Number(data.paidAmount) < 0) {
      errors.paidAmount = "Paid amount cannot be negative";
    } else if (data.totalAmount !== undefined && Number(data.paidAmount) > Number(data.totalAmount)) {
      errors.paidAmount = "Paid amount cannot exceed invoice total";
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

