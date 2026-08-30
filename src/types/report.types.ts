export interface DashboardMetrics {
  totalInvoicedThisMonth: number;
  totalCollectedThisMonth: number;
  totalOutstanding: number;
  totalOverdue: number;
  activeQuotationsCount: number;
  unpaidInvoicesCount: number;
  quotationConversionRate: number; // e.g. 68.5%
}

export interface RevenueDataPoint {
  month: string; // "Jan", "Feb", etc.
  invoiced: number;
  collected: number;
}

export interface ClientReportItem {
  clientId: string;
  clientName: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  invoicesCount: number;
}

export interface QuotationConversionReport {
  totalQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  expiredQuotations: number;
  convertedToInvoiceCount: number;
  conversionRatePercentage: number;
  totalConvertedValue: number;
}
