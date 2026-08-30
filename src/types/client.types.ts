import { Address } from "./common.types";

export interface Client {
  id: string;
  tenantId: string; // Multi-tenant isolation
  name: string; // Contact Person or Company Name
  companyName?: string;
  email?: string;
  phone: string;
  altPhone?: string;
  gstin?: string; // Optional client GSTIN
  pan?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
  tags?: string[]; // e.g. ["Event", "Printing", "Corporate", "Wedding"]
  city?: string;
  state?: string;
  totalBilled?: number;
  totalPaid?: number;
  balanceDue?: number;
  formattedTotalBilled?: string;
  formattedBalanceDue?: string;
  invoicesCount?: number;
  quotationsCount?: number;
  createdAt: string;
  updatedAt?: string;
}


export interface ClientStats {
  totalQuotations: number;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  lastActivityAt?: string;
}
