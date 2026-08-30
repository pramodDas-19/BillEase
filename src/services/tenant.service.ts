import { Tenant, BusinessSettings } from "@/types";
import { MOCK_TENANTS } from "@/mock/tenants.mock";

export class TenantService {
  private static tenants: Tenant[] = [...MOCK_TENANTS];

  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    return this.tenants.find((t) => t.id === tenantId) || null;
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
}
