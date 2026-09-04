import { CurrencyCode, TaxBreakdown } from "./common.types";

export type QuotationStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "converted" | "expired";

/**
 * Line item definition designed for maximum flexibility:
 * - Simple mode (Event Planner): Description + Amount
 * - Detailed mode (Printing Press): Description + Quantity + Unit + Rate + Amount
 * - Flexible: Product catalog is never mandatory, manual descriptions always supported
 */
export interface QuotationLineItem {
  id: string;
  productId?: string; // Optional reference to catalog product/service
  description: string; // Mandatory manual or catalog description
  detailedNotes?: string; // Optional extended scope/specs (e.g., 300 GSM paper, Matte Lamination)
  hsnSacCode?: string; // Optional Indian HSN/SAC code (e.g. 9983 for Photography/Design)
  quantity?: number; // Optional
  unit?: string; // Optional: "pcs", "sqft", "copies", "sets", "days", "hours"
  rate?: number; // Optional unit price
  amount: number; // Mandatory line total
  discountType?: "percentage" | "fixed"; // Optional line discount
  discountValue?: number; // e.g. 6 (%) or 500 (₹)
  discountAmount?: number; // Calculated currency discount
  taxRate?: number; // Optional line-level tax % (e.g. 18)
  taxAmount?: number; // Calculated tax amount
}


export interface Quotation {
  id: string;
  publicToken?: string; // Secure unguessable UUID for client payment portal
  tenantId: string; // Multi-tenant isolation
  quotationNumber: string; // e.g. "QT-2026-001"
  clientId: string;
  clientName: string; // Denormalized for display speed
  clientCompanyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;
  clientPan?: string;

  date: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  status: QuotationStatus;

  currency: CurrencyCode;
  items: QuotationLineItem[];

  // Calculation fields
  subtotal: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  
  // GST / Tax (OPTIONAL)
  isTaxEnabled: boolean;
  gstType?: "intra_state" | "inter_state";
  defaultTaxRate?: number;
  taxBreakdown?: TaxBreakdown[];
  totalTax: number;


  totalAmount: number;

  termsAndConditions?: string;
  notes?: string;

  // Conversion reference
  convertedToInvoiceId?: string;
  convertedAt?: string;

  createdAt: string;
  updatedAt: string;
}
