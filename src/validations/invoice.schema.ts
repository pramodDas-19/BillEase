import { Invoice, InvoiceLineItem } from "@/types";

export type InvoiceFormData = Omit<Invoice, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validateInvoiceLineItem(item: Partial<InvoiceLineItem>, index: number): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!item.description || !item.description.trim()) {
    errors[`items.${index}.description`] = "Description is required";
  }

  if (item.amount === undefined || isNaN(Number(item.amount)) || Number(item.amount) < 0) {
    errors[`items.${index}.amount`] = "Valid amount is required";
  }

  return errors;
}

export function validateInvoice(data: Partial<InvoiceFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.invoiceNumber?.trim()) {
    errors.invoiceNumber = "Invoice number is required";
  }

  if (!data.clientId?.trim()) {
    errors.clientId = "Please select or add a client";
  }

  if (!data.issueDate) {
    errors.issueDate = "Issue date is required";
  }

  if (!data.dueDate) {
    errors.dueDate = "Due date is required";
  }

  if (!data.items || data.items.length === 0) {
    errors.items = "At least one line item is required";
  } else {
    data.items.forEach((item, index) => {
      Object.assign(errors, validateInvoiceLineItem(item, index));
    });
  }

  return errors;
}
