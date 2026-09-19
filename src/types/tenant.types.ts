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
  whatsappReminderTemplate?: string;
  logoUrl?: string;
  signatureUrl?: string;
  paymentReminderSettings?: {
    enableAutoReminders: boolean;
    beforeDueDateDays: number[];
    onDueDate: boolean;
    afterDueDateDays: number[];
  };
  defaultInvoiceTemplate?: string;
  defaultQuotationTemplate?: string;
  defaultDocumentSize?: "a4" | "a5" | "thermal";
  onboarding_welcome_seen_at?: string;
  onboarding_checklist_dismissed_at?: string;
}

export type SubscriptionPlan = "trial" | "free" | "pro_monthly" | "pro_annual" | "enterprise";
export type SubscriptionStatus = "trial_active" | "trial_expired" | "active" | "cancelled";

export type TrialLifecycleState =
  | "TRIAL_ACTIVE_EARLY"    // Days 1–4: Informational slate chip, quiet experience
  | "TRIAL_ACTIVE_MID"      // Days 5–6: Amber chip, 1 slim dismissible usage banner
  | "TRIAL_LAST_DAY"        // Day 7: Warm coral chip, 1-time value summary modal
  | "TRIAL_EXPIRED_GRACE"   // 48h post-expiry: Persistent non-blocking coral banner, full access
  | "TRIAL_EXPIRED_LOCKED"  // Post-grace: Soft paywall on create/edit, read/export always allowed
  | "SUBSCRIBED_ACTIVE"     // Active paid subscription
  | "DOWNGRADED_FREE";      // Explicitly chosen Free Tier

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodEnd?: string;
  gracePeriodEndsAt?: string;
  downgradeChoiceMadeAt?: string;
  dismissedBanners?: {
    day5Banner?: string;
    lastDayModal?: string;
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
  signatureUrl?: string;
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
  subscription?: SubscriptionInfo;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string; // Every user belongs to an isolated tenant
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "super_admin"; // Ready for RBAC
  avatarUrl?: string;
  createdAt: string;
}
