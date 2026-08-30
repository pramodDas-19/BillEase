import { Client } from "@/types";

export type ClientFormData = Omit<Client, "id" | "tenantId" | "createdAt" | "updatedAt">;

export function validateClient(data: Partial<ClientFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Client name is required";
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  // GSTIN format check is optional
  if (data.gstin && data.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstin.trim())) {
    errors.gstin = "Invalid GSTIN format (e.g. 07AAAAA0000A1Z5)";
  }

  return errors;
}
