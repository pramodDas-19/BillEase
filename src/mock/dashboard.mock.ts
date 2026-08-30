export interface FinancialSummaryMetric {
  id: string;
  title: string;
  amount: number;
  formattedAmount: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  supportingText?: string;
  variant: "primary" | "emerald" | "amber" | "rose";
}

export const MOCK_FINANCIAL_SUMMARIES: FinancialSummaryMetric[] = [
  {
    id: "total-invoiced",
    title: "Total Invoiced",
    amount: 485000,
    formattedAmount: "₹4,85,000",
    trend: {
      value: "12.4%",
      isPositive: true,
      label: "from last month",
    },
    supportingText: "28 invoices issued",
    variant: "primary",
  },
  {
    id: "collected",
    title: "Collected",
    amount: 370000,
    formattedAmount: "₹3,70,000",
    trend: {
      value: "8.2%",
      isPositive: true,
      label: "from last month",
    },
    supportingText: "22 settlements received",
    variant: "emerald",
  },
  {
    id: "outstanding",
    title: "Outstanding",
    amount: 115000,
    formattedAmount: "₹1,15,000",
    supportingText: "6 pending invoices",
    variant: "amber",
  },
  {
    id: "overdue",
    title: "Overdue",
    amount: 35000,
    formattedAmount: "₹35,000",
    supportingText: "3 invoices require action",
    variant: "rose",
  },
];

export type TimeRange = "7D" | "30D" | "3M" | "6M" | "1Y";

export interface ChartDataPoint {
  label: string;
  invoiced: number;
  collected: number;
}

export const MOCK_REVENUE_CHART_DATA: Record<TimeRange, ChartDataPoint[]> = {
  "7D": [
    { label: "Mon", invoiced: 45000, collected: 30000 },
    { label: "Tue", invoiced: 60000, collected: 45000 },
    { label: "Wed", invoiced: 35000, collected: 50000 },
    { label: "Thu", invoiced: 80000, collected: 65000 },
    { label: "Fri", invoiced: 95000, collected: 70000 },
    { label: "Sat", invoiced: 110000, collected: 85000 },
    { label: "Sun", invoiced: 60000, collected: 25000 },
  ],
  "30D": [
    { label: "Week 1", invoiced: 115000, collected: 90000 },
    { label: "Week 2", invoiced: 140000, collected: 105000 },
    { label: "Week 3", invoiced: 125000, collected: 85000 },
    { label: "Week 4", invoiced: 105000, collected: 90000 },
  ],
  "3M": [
    { label: "Jun", invoiced: 390000, collected: 310000 },
    { label: "Jul", invoiced: 425000, collected: 345000 },
    { label: "Aug", invoiced: 485000, collected: 370000 },
  ],
  "6M": [
    { label: "Mar", invoiced: 280000, collected: 240000 },
    { label: "Apr", invoiced: 320000, collected: 290000 },
    { label: "May", invoiced: 360000, collected: 310000 },
    { label: "Jun", invoiced: 390000, collected: 310000 },
    { label: "Jul", invoiced: 425000, collected: 345000 },
    { label: "Aug", invoiced: 485000, collected: 370000 },
  ],
  "1Y": [
    { label: "Sep '25", invoiced: 220000, collected: 190000 },
    { label: "Nov '25", invoiced: 260000, collected: 230000 },
    { label: "Jan '26", invoiced: 290000, collected: 260000 },
    { label: "Mar '26", invoiced: 320000, collected: 290000 },
    { label: "May '26", invoiced: 360000, collected: 310000 },
    { label: "Jul '26", invoiced: 425000, collected: 345000 },
    { label: "Aug '26", invoiced: 485000, collected: 370000 },
  ],
};

export interface PaymentAttentionItem {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientPhone?: string;
  invoiceNumber: string;
  amount: number;
  formattedAmount: string;
  status: "overdue" | "due_today" | "upcoming";
  statusText: string;
  dateInfo: string;
  canSendReminder: boolean;
}

export const MOCK_PAYMENT_ATTENTION: PaymentAttentionItem[] = [
  {
    id: "att-1",
    clientName: "Rahul Sharma",
    clientPhone: "+91 98201 45890",
    invoiceNumber: "INV-1024",
    amount: 60000,
    formattedAmount: "₹60,000",
    status: "overdue",
    statusText: "5 days overdue",
    dateInfo: "Due on 25 Aug 2026",
    canSendReminder: true,
  },
  {
    id: "att-2",
    clientName: "ABC Corporation",
    clientPhone: "+91 98112 34567",
    invoiceNumber: "INV-1021",
    amount: 25000,
    formattedAmount: "₹25,000",
    status: "due_today",
    statusText: "Due today",
    dateInfo: "Due Today (30 Aug)",
    canSendReminder: true,
  },
  {
    id: "att-3",
    clientName: "Priya Events",
    clientPhone: "+91 99230 78120",
    invoiceNumber: "INV-1018",
    amount: 15000,
    formattedAmount: "₹15,000",
    status: "upcoming",
    statusText: "Due in 2 days",
    dateInfo: "Due on 01 Sep 2026",
    canSendReminder: false,
  },
  {
    id: "att-4",
    clientName: "Metro Media Works",
    clientPhone: "+91 97654 12390",
    invoiceNumber: "INV-1015",
    amount: 15000,
    formattedAmount: "₹15,000",
    status: "overdue",
    statusText: "8 days overdue",
    dateInfo: "Due on 22 Aug 2026",
    canSendReminder: true,
  },
];


export interface DashboardQuotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  description?: string;
  amount: number;
  formattedAmount: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  date: string;
}

export const MOCK_DASHBOARD_QUOTATIONS: DashboardQuotation[] = [
  {
    id: "qt-0042",
    quotationNumber: "QT-0042",
    clientName: "Rahul Sharma",
    description: "Annual Tech Conference Stage & Audio",
    amount: 135000,
    formattedAmount: "₹1,35,000",
    status: "accepted",
    date: "28 Aug 2026",
  },
  {
    id: "qt-0041",
    quotationNumber: "QT-0041",
    clientName: "Priya Events",
    description: "Floral Mandap & Theme Entry Arch",
    amount: 75000,
    formattedAmount: "₹75,000",
    status: "sent",
    date: "27 Aug 2026",
  },
  {
    id: "qt-0040",
    quotationNumber: "QT-0040",
    clientName: "ABC Corporation",
    description: "5000 Art Card Brochures & Vinyl Banners",
    amount: 42000,
    formattedAmount: "₹42,000",
    status: "draft",
    date: "26 Aug 2026",
  },
  {
    id: "qt-0039",
    quotationNumber: "QT-0039",
    clientName: "Zenith Studio",
    description: "Product Launch LED Wall & Sound Rig",
    amount: 98000,
    formattedAmount: "₹98,000",
    status: "accepted",
    date: "24 Aug 2026",
  },
];

export interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  formattedAmount: string;
  status: "paid" | "due" | "overdue" | "partially_paid";
  balanceDue?: number;
  formattedBalanceDue?: string;
  date: string;
}

export const MOCK_DASHBOARD_INVOICES: DashboardInvoice[] = [
  {
    id: "inv-0038",
    invoiceNumber: "INV-0038",
    clientName: "Rahul Sharma",
    amount: 85000,
    formattedAmount: "₹85,000",
    status: "paid",
    date: "25 Aug 2026",
  },
  {
    id: "inv-0037",
    invoiceNumber: "INV-0037",
    clientName: "Priya Events",
    amount: 45000,
    formattedAmount: "₹45,000",
    status: "due",
    balanceDue: 45000,
    formattedBalanceDue: "₹45,000",
    date: "27 Aug 2026",
  },
  {
    id: "inv-0036",
    invoiceNumber: "INV-0036",
    clientName: "ABC Corporation",
    amount: 32000,
    formattedAmount: "₹32,000",
    status: "overdue",
    balanceDue: 32000,
    formattedBalanceDue: "₹32,000",
    date: "10 Aug 2026",
  },
  {
    id: "inv-0035",
    invoiceNumber: "INV-0035",
    clientName: "Nexus Media",
    amount: 40000,
    formattedAmount: "₹40,000",
    status: "partially_paid",
    balanceDue: 15000,
    formattedBalanceDue: "₹15,000",
    date: "18 Aug 2026",
  },
];
