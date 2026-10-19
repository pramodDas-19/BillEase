import { Tenant } from "@/types";
import { GST_STATE_CODES } from "@/lib/gst-engine";

export interface SettingsValidationInput {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  // Bank & UPI
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  // Numbering
  quotePrefix?: string;
  quoteNext?: number;
  invPrefix?: string;
  invNext?: number;
  // Tax & Currency
  enableGstByDefault?: boolean;
  defaultTaxRate?: number;
}

export function validateSettings(data: SettingsValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};

  // 1. Business Profile
  if (!data.businessName || data.businessName.trim().length < 2) {
    errors.businessName = "Business name must be at least 2 characters";
  }

  if (!data.ownerName || data.ownerName.trim().length < 2) {
    errors.ownerName = "Owner / Signatory name must be at least 2 characters";
  }

  const rawPhone = (data.phone || "").replace(/[^0-9]/g, "");
  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (rawPhone.length < 10) {
    errors.phone = "Please enter a valid phone number (at least 10 digits)";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  // GSTIN (optional, but if provided must follow Indian GST rules)
  if (data.gstin && data.gstin.trim()) {
    const cleanGstin = data.gstin.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      errors.gstin = "Invalid GSTIN format (15 characters, e.g. 27AAAAA0000A1Z5)";
    } else {
      const stateCode = cleanGstin.slice(0, 2);
      if (!GST_STATE_CODES[stateCode]) {
        errors.gstin = `Invalid GST State Code "${stateCode}". Must be a valid Indian state code (01-38, 97).`;
      }
    }
  }

  // 2. Bank & UPI
  if (data.upiId && data.upiId.trim()) {
    const cleanUpi = data.upiId.trim();
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      errors.upiId = "Invalid UPI ID / VPA format (e.g. username@okhdfcbank)";
    }
  }

  if (data.ifscCode && data.ifscCode.trim()) {
    const cleanIfsc = data.ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      errors.ifscCode = "Invalid IFSC Code (11 characters, 4 letters + 0 + 6 alphanumeric, e.g. HDFC0001234)";
    }
  }

  if (data.accountNumber && data.accountNumber.trim()) {
    const cleanAcc = data.accountNumber.trim();
    if (!/^[0-9]{9,18}$/.test(cleanAcc)) {
      errors.accountNumber = "Bank account number must be 9 to 18 numeric digits";
    }
  }

  // 3. Document Numbering
  if (data.quotePrefix !== undefined) {
    if (!data.quotePrefix.trim()) {
      errors.quotePrefix = "Quotation prefix is required (e.g. QT-)";
    } else if (/[^a-zA-Z0-9\-_/]/.test(data.quotePrefix.trim())) {
      errors.quotePrefix = "Prefix can only contain letters, numbers, hyphens, and slashes";
    }
  }

  if (data.quoteNext !== undefined) {
    if (isNaN(data.quoteNext) || data.quoteNext < 1) {
      errors.quoteNext = "Next quotation number must be a positive integer (>= 1)";
    }
  }

  if (data.invPrefix !== undefined) {
    if (!data.invPrefix.trim()) {
      errors.invPrefix = "Invoice prefix is required (e.g. INV-)";
    } else if (/[^a-zA-Z0-9\-_/]/.test(data.invPrefix.trim())) {
      errors.invPrefix = "Prefix can only contain letters, numbers, hyphens, and slashes";
    }
  }

  if (data.invNext !== undefined) {
    if (isNaN(data.invNext) || data.invNext < 1) {
      errors.invNext = "Next invoice number must be a positive integer (>= 1)";
    }
  }

  // 4. Tax
  if (data.defaultTaxRate !== undefined) {
    if (isNaN(data.defaultTaxRate) || data.defaultTaxRate < 0 || data.defaultTaxRate > 100) {
      errors.defaultTaxRate = "Default tax rate must be between 0% and 100%";
    }
  }

  return errors;
}

// Backward-compatible alias
export function validateBusinessProfile(data: Partial<Tenant>): Record<string, string> {
  return validateSettings({
    businessName: data.businessName,
    ownerName: data.ownerName,
    phone: data.phone,
    email: data.email,
    gstin: data.gstin,
  });
}
