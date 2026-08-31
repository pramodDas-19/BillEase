import { DashboardMetrics, RevenueDataPoint, QuotationConversionReport } from "@/types";
import { InvoiceService } from "./invoice.service";
import { QuotationService } from "./quotation.service";

export class ReportService {
  static async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    const [invoices, quotations] = await Promise.all([
      InvoiceService.getInvoices(),
      QuotationService.getQuotations(),
    ]);

    const totalInvoicedThisMonth = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalCollectedThisMonth = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
    const totalOverdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((acc, i) => acc + (i.balanceDue || 0), 0);

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
    const invoices = await InvoiceService.getInvoices();
    const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);

    return months.map((m, idx) => ({
      month: m,
      invoiced: idx === months.length - 1 ? totalInvoiced : 0,
      collected: idx === months.length - 1 ? totalCollected : 0,
    }));
  }

  static async getQuotationConversion(tenantId: string): Promise<QuotationConversionReport> {
    const quotations = await QuotationService.getQuotations();
    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter((q) => q.status === "accepted").length;
    const rejectedQuotations = quotations.filter((q) => q.status === "rejected").length;
    const expiredQuotations = quotations.filter((q) => q.status === "expired").length;
    const convertedToInvoiceCount = quotations.filter((q) => q.status === "converted").length;

    const totalConvertedValue = quotations
      .filter((q) => q.status === "converted" || q.status === "accepted")
      .reduce((acc, q) => acc + (q.totalAmount || 0), 0);

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
