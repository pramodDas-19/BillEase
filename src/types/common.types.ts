export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "SGD";

export type PaymentMethod = "bank_transfer" | "cash" | "upi" | "cheque" | "card" | "online" | "other";

export type PaginationParams = {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface TaxBreakdown {
  rate: number; // e.g. 18 for 18%
  name: string; // e.g. "GST", "CGST+SGST", "VAT"
  amount: number;
}
