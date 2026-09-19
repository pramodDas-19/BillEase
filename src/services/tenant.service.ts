import { Tenant, BusinessSettings, SubscriptionInfo } from "@/types";
import { MOCK_TENANTS } from "@/mock/tenants.mock";

export class TenantService {
  private static tenants: Tenant[] = [...MOCK_TENANTS];
  private static isRealDataLoaded = false;

  static async getAllTenants(): Promise<Tenant[]> {
    if (typeof window !== "undefined") {
      try {
        // Attempt to fetch 100% REAL live tenants and aggregations from Supabase via admin API
        const response = await fetch("/api/admin/tenants", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.tenants) && data.tenants.length > 0) {
            this.tenants = data.tenants;
            this.isRealDataLoaded = true;
            return [...this.tenants];
          }
        }
      } catch (e) {
        console.warn("Falling back to local cache/seed in TenantService:", e);
      }

      // Fallback for non-admin client sessions
      try {
        const stored = localStorage.getItem("billease_registered_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.tenantId && !this.tenants.some((t) => t.id === parsed.tenantId)) {
            this.tenants.unshift({
              id: parsed.tenantId,
              businessName: parsed.businessName || "My Business",
              slug: parsed.tenantId,
              businessType: "other",
              ownerName: parsed.ownerName || "Owner",
              email: parsed.email || "",
              phone: parsed.phone || "",
              settings: {
                defaultCurrency: "INR",
                enableGstByDefault: true,
                defaultTaxRate: 18,
                defaultQuotationValidityDays: 14,
                defaultInvoiceDueDays: 14,
                quotationNumbering: { prefix: "QT-", nextNumber: 1001, digitLength: 4 },
                invoiceNumbering: { prefix: "INV-", nextNumber: 1001, digitLength: 4 },
              },
              subscription: {
                plan: "trial",
                status: "trial_active",
                trialStartDate: new Date().toISOString(),
                trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.warn("Could not parse registered user in TenantService:", e);
      }
    }
    return [...this.tenants];
  }

  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    const list = await this.getAllTenants();
    return list.find((t) => t.id === tenantId) || null;
  }

  static async updateSettings(tenantId: string, settings: Partial<BusinessSettings>): Promise<Tenant | null> {
    const index = this.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) return null;

    this.tenants[index] = {
      ...this.tenants[index],
      settings: {
        ...this.tenants[index].settings,
        ...settings,
      },
      updatedAt: new Date().toISOString(),
    };

    return this.tenants[index];
  }

  static async updateProfile(tenantId: string, profile: Partial<Tenant>): Promise<Tenant | null> {
    const index = this.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) return null;

    this.tenants[index] = {
      ...this.tenants[index],
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    return this.tenants[index];
  }

  static async extendTrial(tenantId: string, additionalDays: number = 7): Promise<Tenant | null> {
    // 1. Send live update to Supabase
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/admin/tenants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            action: "extend_trial",
            additionalDays,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            const index = this.tenants.findIndex((t) => t.id === tenantId);
            if (index !== -1) {
              this.tenants[index].subscription = data.subscription;
              return this.tenants[index];
            }
          }
        }
      } catch (e) {
        console.error("Live extend trial error in Supabase:", e);
      }
    }

    // Local fallback
    const index = this.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) return null;

    const currentEnd = this.tenants[index].subscription?.trialEndDate
      ? new Date(this.tenants[index].subscription!.trialEndDate!).getTime()
      : Date.now();
    const newEnd = new Date(Math.max(Date.now(), currentEnd) + additionalDays * 24 * 60 * 60 * 1000).toISOString();

    this.tenants[index] = {
      ...this.tenants[index],
      subscription: {
        plan: "trial",
        status: "trial_active",
        trialStartDate: this.tenants[index].subscription?.trialStartDate || new Date().toISOString(),
        trialEndDate: newEnd,
      },
      updatedAt: new Date().toISOString(),
    };

    return this.tenants[index];
  }

  static async updateSubscription(tenantId: string, subscription: Partial<SubscriptionInfo>): Promise<Tenant | null> {
    // 1. Send live update to Supabase
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/admin/tenants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            action: "set_pro",
            plan: subscription.plan || "pro_monthly",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            const index = this.tenants.findIndex((t) => t.id === tenantId);
            if (index !== -1) {
              this.tenants[index].subscription = data.subscription;
              return this.tenants[index];
            }
          }
        }
      } catch (e) {
        console.error("Live update subscription error in Supabase:", e);
      }
    }

    // Local fallback
    const index = this.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) return null;

    const existingSub = this.tenants[index].subscription;

    this.tenants[index] = {
      ...this.tenants[index],
      subscription: {
        plan: subscription.plan || existingSub?.plan || "trial",
        status: subscription.status || existingSub?.status || "trial_active",
        ...existingSub,
        ...subscription,
      },
      updatedAt: new Date().toISOString(),
    };

    return this.tenants[index];
  }
}
