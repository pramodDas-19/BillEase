import { ProductOrService, ServiceCategory } from "@/types";
import { MOCK_SERVICES } from "@/mock/services.mock";

export class ServiceCatalogService {
  private static services: ProductOrService[] = [...MOCK_SERVICES];

  static async getServices(tenantId: string, category?: ServiceCategory): Promise<ProductOrService[]> {
    let list = this.services.filter((s) => s.tenantId === tenantId);
    if (category) {
      list = list.filter((s) => s.category === category);
    }
    return list;
  }

  static async getServiceById(tenantId: string, id: string): Promise<ProductOrService | null> {
    return this.services.find((s) => s.tenantId === tenantId && s.id === id) || null;
  }

  static async createService(
    tenantId: string,
    data: Omit<ProductOrService, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<ProductOrService> {
    const newService: ProductOrService = {
      ...data,
      id: `srv-${Date.now()}`,
      tenantId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.services.unshift(newService);
    return newService;
  }

  static async updateService(
    tenantId: string,
    id: string,
    data: Partial<ProductOrService>
  ): Promise<ProductOrService | null> {
    const index = this.services.findIndex((s) => s.tenantId === tenantId && s.id === id);
    if (index === -1) return null;

    this.services[index] = {
      ...this.services[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.services[index];
  }
}
