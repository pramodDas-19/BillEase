import { Client, ClientStats } from "@/types";
import { MOCK_CLIENTS } from "@/mock/clients.mock";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";

export class ClientService {
  private static clients: Client[] = [...MOCK_CLIENTS];

  static async getClients(tenantId: string, search?: string): Promise<Client[]> {
    // Tenant Isolation
    let results = this.clients.filter((c) => c.tenantId === tenantId);

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    return results;
  }

  static async getClientById(tenantId: string, clientId: string): Promise<Client | null> {
    return (
      this.clients.find((c) => c.tenantId === tenantId && c.id === clientId) ||
      null
    );
  }

  static async createClient(tenantId: string, data: Omit<Client, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Client> {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.clients.unshift(newClient);
    return newClient;
  }

  static async updateClient(tenantId: string, clientId: string, data: Partial<Client>): Promise<Client | null> {
    const index = this.clients.findIndex((c) => c.tenantId === tenantId && c.id === clientId);
    if (index === -1) return null;

    this.clients[index] = {
      ...this.clients[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.clients[index];
  }

  static async getClientStats(tenantId: string, clientId: string): Promise<ClientStats> {
    const clientQuotes = MOCK_QUOTATIONS.filter((q) => q.tenantId === tenantId && q.clientId === clientId);
    const clientInvoices = MOCK_INVOICES.filter((i) => i.tenantId === tenantId && i.clientId === clientId);

    const totalBilled = clientInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = clientInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const outstandingBalance = clientInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

    return {
      totalQuotations: clientQuotes.length,
      totalInvoices: clientInvoices.length,
      totalBilled,
      totalPaid,
      outstandingBalance,
      lastActivityAt: clientInvoices[0]?.createdAt || clientQuotes[0]?.createdAt,
    };
  }
}
