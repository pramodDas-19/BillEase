export type ServiceCategory = "event" | "printing" | "design" | "custom";

export interface ProductOrService {
  id: string;
  tenantId: string; // Multi-tenant isolation
  name: string; // e.g. "Stage Lighting Setup", "350 GSM Visiting Cards"
  category: ServiceCategory;
  description?: string;
  defaultRate?: number;
  defaultUnit?: string; // "pcs", "sq ft", "event", "hours", "sets"
  defaultTaxRate?: number; // Optional GST %
  hsnSacCode?: string; // Optional HSN/SAC code for GST compliance
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
