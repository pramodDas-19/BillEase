import { Invoice, InvoiceStatus, Quotation } from "@/types";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { QuotationService } from "./quotation.service";

export class InvoiceService {
  private static invoices: Invoice[] = [...MOCK_INVOICES];

  static async getInvoices(tenantId: string, status?: InvoiceStatus): Promise<Invoice[]> {
    let list = this.invoices.filter((i) => i.tenantId === tenantId);
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    return list;
  }

  static async getInvoiceById(tenantId: string, id: string): Promise<Invoice | null> {
    return this.invoices.find((i) => i.tenantId === tenantId && i.id === id) || null;
  }

  static async createInvoice(
    tenantId: string,
    data: Omit<Invoice, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      tenantId,
      paidAmount: data.paidAmount || 0,
      balanceDue: data.balanceDue ?? (data.totalAmount - (data.paidAmount || 0)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  /**
   * Convert an accepted quotation directly into a draft/sent invoice
   */
  static async convertFromQuotation(
    tenantId: string,
    quotation: Quotation,
    invoiceNumber: string,
    dueDate: string
  ): Promise<Invoice> {
    const newInvoice = await this.createInvoice(tenantId, {
      invoiceNumber,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      clientId: quotation.clientId,
      clientName: quotation.clientName,
      clientEmail: quotation.clientEmail,
      clientPhone: quotation.clientPhone,
      clientAddress: quotation.clientAddress,
      clientGstin: quotation.clientGstin,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate,
      status: "due",
      currency: quotation.currency,
      items: quotation.items.map((item) => ({ ...item })),
      subtotal: quotation.subtotal,
      discountType: quotation.discountType,
      discountValue: quotation.discountValue,
      discountAmount: quotation.discountAmount,
      isTaxEnabled: quotation.isTaxEnabled,
      taxBreakdown: quotation.taxBreakdown,
      totalTax: quotation.totalTax,
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      balanceDue: quotation.totalAmount,
      termsAndConditions: quotation.termsAndConditions,
      notes: quotation.notes,
    });

    // Mark the quotation as converted
    await QuotationService.updateQuotation(tenantId, quotation.id, {
      status: "converted",
      convertedToInvoiceId: newInvoice.id,
      convertedAt: new Date().toISOString(),
    });

    return newInvoice;
  }

  static async recordPaymentAgainstInvoice(
    tenantId: string,
    invoiceId: string,
    paymentAmount: number
  ): Promise<Invoice | null> {
    const index = this.invoices.findIndex((i) => i.tenantId === tenantId && i.id === invoiceId);
    if (index === -1) return null;

    const current = this.invoices[index];
    const newPaidAmount = Math.round((current.paidAmount + paymentAmount) * 100) / 100;
    const newBalanceDue = Math.max(0, Math.round((current.totalAmount - newPaidAmount) * 100) / 100);

    let newStatus: InvoiceStatus = current.status;
    if (newBalanceDue === 0) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    }

    this.invoices[index] = {
      ...current,
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.invoices[index];
  }
}
