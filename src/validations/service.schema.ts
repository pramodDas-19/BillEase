import { ServiceItem } from "@/types";

export type ServiceFormData = Omit<ServiceItem, "id" | "tenantId" | "createdAt" | "updatedAt">;

export const STANDARD_GST_SLABS = [0, 5, 12, 18, 28];

export function validateService(data: Partial<ServiceFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  // 1. Name is required
  if (!data.name || !data.name.trim()) {
    errors.name = "Item / Service name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Item name must be at least 2 characters";
  }

  // 2. Rate must be non-negative if provided
  const rate = data.rate !== undefined ? Number(data.rate) : (data.defaultRate !== undefined ? Number(data.defaultRate) : undefined);
  if (rate !== undefined && (isNaN(rate) || rate < 0)) {
    errors.rate = "Rate must be a non-negative number (0 or higher)";
  }

  // 3. GST Rate check (should match Indian GST slabs or be 0-100)
  const gstRate = data.gstRate !== undefined ? Number(data.gstRate) : (data.defaultTaxRate !== undefined ? Number(data.defaultTaxRate) : undefined);
  if (gstRate !== undefined) {
    if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
      errors.gstRate = "GST rate must be between 0% and 100%";
    }
  }

  // 4. HSN / SAC Code validation (optional, but if provided must be 2, 4, 6, or 8 digits)
  const hsn = (data.hsnSac || data.hsnSacCode || "").trim();
  if (hsn) {
    // Digits only check
    const cleanHsn = hsn.replace(/\s+/g, "");
    if (!/^\d{2,8}$/.test(cleanHsn)) {
      errors.hsnSac = "HSN/SAC must be 2 to 8 numeric digits (e.g. 998314 for services, 8471 for goods)";
    }
  }

  return errors;
}
