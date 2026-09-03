export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates incoming Invoice payload on the server before database mutation.
 */
export function validateInvoiceInput(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid invoice payload: Expected JSON object."] };
  }

  // 1. Client Name
  if (!data.clientName || typeof data.clientName !== "string" || data.clientName.trim().length === 0) {
    errors.push("Client name is required and cannot be empty.");
  }

  // 2. Line Items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("Invoice must contain at least one line item.");
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item || typeof item !== "object") {
        errors.push(`Line item #${index + 1} is invalid.`);
      } else {
        if (!item.description || typeof item.description !== "string" || item.description.trim().length === 0) {
          errors.push(`Line item #${index + 1} must have a description.`);
        }
        if (typeof item.amount !== "number" || isNaN(item.amount) || item.amount < 0) {
          errors.push(`Line item #${index + 1} amount must be a positive number.`);
        }
      }
    });
  }

  // 3. Financial Fields
  if (data.subtotal !== undefined && (typeof data.subtotal !== "number" || isNaN(data.subtotal) || data.subtotal < 0)) {
    errors.push("Subtotal must be a non-negative number.");
  }

  if (data.totalAmount !== undefined && (typeof data.totalAmount !== "number" || isNaN(data.totalAmount) || data.totalAmount < 0)) {
    errors.push("Total amount must be a non-negative number.");
  }

  if (data.discountAmount !== undefined && (typeof data.discountAmount !== "number" || isNaN(data.discountAmount) || data.discountAmount < 0)) {
    errors.push("Discount amount cannot be negative.");
  }

  if (data.paidAmount !== undefined && (typeof data.paidAmount !== "number" || isNaN(data.paidAmount) || data.paidAmount < 0)) {
    errors.push("Paid amount cannot be negative.");
  }

  // 4. Dates
  if (data.issueDate && !isValidIsoDate(data.issueDate)) {
    errors.push("Issue date must be in YYYY-MM-DD format.");
  }
  if (data.dueDate && !isValidIsoDate(data.dueDate)) {
    errors.push("Due date must be in YYYY-MM-DD format.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates incoming Quotation payload on the server.
 */
export function validateQuotationInput(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid quotation payload: Expected JSON object."] };
  }

  if (!data.clientName || typeof data.clientName !== "string" || data.clientName.trim().length === 0) {
    errors.push("Client name is required and cannot be empty.");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("Quotation must contain at least one line item.");
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item || typeof item !== "object") {
        errors.push(`Line item #${index + 1} is invalid.`);
      } else {
        if (!item.description || typeof item.description !== "string" || item.description.trim().length === 0) {
          errors.push(`Line item #${index + 1} must have a description.`);
        }
        if (typeof item.amount !== "number" || isNaN(item.amount) || item.amount < 0) {
          errors.push(`Line item #${index + 1} amount must be a positive number.`);
        }
      }
    });
  }

  if (data.totalAmount !== undefined && (typeof data.totalAmount !== "number" || isNaN(data.totalAmount) || data.totalAmount < 0)) {
    errors.push("Total amount must be a non-negative number.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates Client details
 */
export function validateClientInput(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid client payload."] };
  }

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("Client name is required.");
  }

  if (data.email && typeof data.email === "string" && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push("Invalid email address format.");
    }
  }

  if (data.gstin && typeof data.gstin === "string" && data.gstin.trim().length > 0) {
    const gstinClean = data.gstin.trim();
    if (gstinClean.length !== 15) {
      errors.push("GSTIN must be exactly 15 characters.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidIsoDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}
