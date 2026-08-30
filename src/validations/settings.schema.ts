import { Tenant } from "@/types";

export function validateBusinessProfile(data: Partial<Tenant>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.businessName?.trim()) {
    errors.businessName = "Business name is required";
  }

  if (!data.phone?.trim()) {
    errors.phone = "Phone number is required";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Valid email address is required";
  }

  // GSTIN is completely optional. If provided, check standard format.
  if (data.gstin && data.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstin.trim())) {
    errors.gstin = "Invalid GSTIN format (e.g. 07AAAAA0000A1Z5)";
  }

  return errors;
}
