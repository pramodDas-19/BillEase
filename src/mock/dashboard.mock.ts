export type TimeRange = "7D" | "30D" | "3M" | "6M" | "1Y";

export interface ChartDataPoint {
  label: string;
  invoiced: number;
  collected: number;
}

export interface FinancialSummaryMetric {
  id: string;
  title: string;
  amount: number;
  formattedAmount: string;
  variant: "primary" | "emerald" | "amber" | "rose";
}

export const MOCK_FINANCIAL_SUMMARIES: FinancialSummaryMetric[] = [];
export const MOCK_PAYMENT_ATTENTION: any[] = [];
export const MOCK_DASHBOARD_QUOTATIONS: any[] = [];
export const MOCK_DASHBOARD_INVOICES: any[] = [];
export const MOCK_REVENUE_CHART_DATA: Record<TimeRange, ChartDataPoint[]> = {
  "7D": [],
  "30D": [],
  "3M": [],
  "6M": [],
  "1Y": [],
};
