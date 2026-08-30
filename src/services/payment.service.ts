import { Payment } from "@/types";
import { MOCK_PAYMENTS } from "@/mock/payments.mock";
import { InvoiceService } from "./invoice.service";

export class PaymentService {
  private static payments: Payment[] = [...MOCK_PAYMENTS];

  static async getPayments(tenantId: string): Promise<Payment[]> {
    return this.payments.filter((p) => p.tenantId === tenantId);
  }

  static async getPaymentsByInvoice(tenantId: string, invoiceId: string): Promise<Payment[]> {
    return this.payments.filter((p) => p.tenantId === tenantId && p.invoiceId === invoiceId);
  }

  static async recordPayment(
    tenantId: string,
    data: Omit<Payment, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<Payment> {
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      tenantId,
      status: data.status || "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments.unshift(newPayment);

    // Update invoice paidAmount and balanceDue
    if (newPayment.status === "completed") {
      await InvoiceService.recordPaymentAgainstInvoice(tenantId, data.invoiceId, data.amount);
    }

    return newPayment;
  }
}
