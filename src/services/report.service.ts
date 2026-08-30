import { DashboardMetrics, RevenueDataPoint, QuotationConversionReport } from "@/types";
import { MOCK_INVOICES } from "@/mock/invoices.mock";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";

export class ReportService {
  static async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    const invoices = MOCK_INVOICES.filter((i) => i.tenantId === tenantId);
    const quotations = MOCK_QUOTATIONS.filter((q) => q.tenantId === tenantId);

    const totalInvoicedThisMonth = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalCollectedThisMonth = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const totalOutstanding = invoices.reduce((acc, i) => acc + i.balanceDue, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((acc, i) => acc + i.balanceDue, 0);

    const activeQuotationsCount = quotations.filter((q) => q.status === "sent" || q.status === "draft").length;
    const unpaidInvoicesCount = invoices.filter((i) => i.balanceDue > 0).length;

    const convertedQuotes = quotations.filter((q) => q.status === "converted" || q.status === "accepted").length;
    const quotationConversionRate = quotations.length > 0
      ? Math.round((convertedQuotes / quotations.length) * 100)
      : 0;

    return {
      totalInvoicedThisMonth,
      totalCollectedThisMonth,
      totalOutstanding,
      totalOverdue,
      activeQuotationsCount,
      unpaidInvoicesCount,
      quotationConversionRate,
    };
  }

  static async getRevenueOverview(tenantId: string): Promise<RevenueDataPoint[]> {
    // Tenant-isolated revenue trend data placeholder
    return [
      { month: "Mar", invoiced: 45000, collected: 45000 },
      { month: "Apr", invoiced: 82000, collected: 70000 },
      { month: "May", invoiced: 95000, collected: 90000 },
      { month: "Jun", invoiced: 130000, collected: 110000 },
      { month: "Jul", invoiced: 155000, collected: 140000 },
      { month: "Aug", invoiced: 202050, collected: 95850 },
    ];
  }

  static async getQuotationConversion(tenantId: string): Promise<QuotationConversionReport> {
    const quotations = MOCK_QUOTATIONS.filter((q) => q.tenantId === tenantId);
    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter((q) => q.status === "accepted").length;
    const rejectedQuotations = quotations.filter((q) => q.status === "rejected").length;
    const expiredQuotations = quotations.filter((q) => q.status === "expired").length;
    const convertedToInvoiceCount = quotations.filter((q) => q.status === "converted").length;

    const totalConvertedValue = quotations
      .filter((q) => q.status === "converted" || q.status === "accepted")
      .reduce((acc, q) => acc + q.totalAmount, 0);

    const conversionRatePercentage = totalQuotations > 0
      ? Math.round(((acceptedQuotations + convertedToInvoiceCount) / totalQuotations) * 100)
      : 0;

    return {
      totalQuotations,
      acceptedQuotations,
      rejectedQuotations,
      expiredQuotations,
      convertedToInvoiceCount,
      conversionRatePercentage,
      totalConvertedValue,
    };
  }
}
