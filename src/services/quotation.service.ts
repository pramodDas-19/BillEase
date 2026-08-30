import { Quotation, QuotationStatus } from "@/types";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";

export class QuotationService {
  private static quotations: Quotation[] = [...MOCK_QUOTATIONS];

  static async getQuotations(tenantId: string, status?: QuotationStatus): Promise<Quotation[]> {
    // Tenant Isolation
    let list = this.quotations.filter((q) => q.tenantId === tenantId);
    if (status) {
      list = list.filter((q) => q.status === status);
    }
    return list;
  }

  static async getQuotationById(tenantId: string, id: string): Promise<Quotation | null> {
    return this.quotations.find((q) => q.tenantId === tenantId && q.id === id) || null;
  }

  static async createQuotation(
    tenantId: string,
    data: Omit<Quotation, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Quotation> {
    const newQuote: Quotation = {
      ...data,
      id: `qt-${Date.now()}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotations.unshift(newQuote);
    return newQuote;
  }

  static async updateQuotation(
    tenantId: string,
    id: string,
    data: Partial<Quotation>
  ): Promise<Quotation | null> {
    const index = this.quotations.findIndex((q) => q.tenantId === tenantId && q.id === id);
    if (index === -1) return null;

    this.quotations[index] = {
      ...this.quotations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.quotations[index];
  }

  static async updateStatus(
    tenantId: string,
    id: string,
    status: QuotationStatus
  ): Promise<Quotation | null> {
    return this.updateQuotation(tenantId, id, { status });
  }
}
