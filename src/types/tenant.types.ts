import { Address, CurrencyCode } from "./common.types";

export type BusinessType = "event_planner" | "graphic_designer" | "printing_press" | "hybrid_event_and_print" | "other";

export interface NumberingSequenceConfig {
  prefix: string; // e.g. "QT-", "INV-"
  nextNumber: number; // e.g. 1001
  digitLength: number; // e.g. 4 -> "0001"
  suffix?: string; // e.g. "/24-25"
}

export interface BusinessSettings {
  defaultCurrency: CurrencyCode;
  quotationNumbering: NumberingSequenceConfig;
  invoiceNumbering: NumberingSequenceConfig;
  defaultTaxRate?: number; // Optional GST default (e.g. 18%)
  enableGstByDefault: boolean; // Default false (simple by default)
  defaultQuotationValidityDays: number; // e.g. 15 or 30 days
  defaultInvoiceDueDays: number; // e.g. 15 or 30 days
  defaultTermsAndConditions?: string;
  defaultQuotationNotes?: string;
  defaultInvoiceNotes?: string;
  paymentReminderSettings?: {
    enableAutoReminders: boolean;
    beforeDueDateDays: number[];
    onDueDate: boolean;
    afterDueDateDays: number[];
  };
}

export interface Tenant {
  id: string; // Isolated tenant ID
  businessName: string;
  slug: string;
  businessType: BusinessType;
  ownerName: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  address?: Address;
  gstin?: string; // OPTIONAL - business can operate without GSTIN
  pan?: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
    upiId?: string;
    qrCodeUrl?: string;
  };
  settings: BusinessSettings;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string; // Every user belongs to an isolated tenant
  email: string;
  name: string;
  role: "owner" | "admin" | "member"; // Ready for future RBAC
  avatarUrl?: string;
  createdAt: string;
}
