export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  isExternal?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const DASHBOARD_NAV_CONFIG: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        title: "Clients",
        href: "/clients",
        iconName: "Users",
      },
      {
        title: "Services",
        href: "/services",
        iconName: "Package",
      },
    ],
  },
  {
    title: "Sales",
    items: [
      {
        title: "Quotations",
        href: "/quotations",
        iconName: "FileText",
      },
      {
        title: "Invoices",
        href: "/invoices",
        iconName: "ReceiptText",
      },
      {
        title: "Payments",
        href: "/payments",
        iconName: "CreditCard",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/reports",
        iconName: "BarChart3",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        iconName: "Settings",
      },
    ],
  },
];
