import { Client } from "@/types";
import { GST_STATE_CODES } from "@/lib/gst-engine";

export type ClientFormData = Omit<Client, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validateClient(data: Partial<ClientFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Client / Contact name is required";
  }

  const rawPhone = (data.phone || "").replace(/[^0-9]/g, "");
  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (rawPhone.length < 10) {
    errors.phone = "Please enter a valid phone number (at least 10 digits)";
  }

  if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  // GSTIN format check (optional, but if provided must follow Indian GST rules)
  if (data.gstin && data.gstin.trim()) {
    const cleanGstin = data.gstin.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      errors.gstin = "Invalid GSTIN format (e.g. 27AAAAA0000A1Z5 - 15 characters)";
    } else {
      const stateCode = cleanGstin.slice(0, 2);
      if (!GST_STATE_CODES[stateCode]) {
        errors.gstin = `Invalid GST State Code "${stateCode}". Must be a valid Indian state code (01-38, 97).`;
      }
    }
  }

  return errors;
}
