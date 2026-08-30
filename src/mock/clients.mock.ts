export interface MockClientDetail {
  id: string;
  tenantId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  gstin?: string;
  city: string;
  state: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  tags: string[];
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  formattedTotalBilled: string;
  formattedBalanceDue: string;
  invoicesCount: number;
  quotationsCount: number;
  createdAt: string;
}

export const MOCK_CLIENTS_DATA: MockClientDetail[] = [
  {
    id: "client-1",
    tenantId: "tenant-royal-events",
    name: "Rahul Sharma",
    companyName: "Sharma Tech Solutions",
    email: "rahul@sharmatech.in",
    phone: "+91 98201 45890",
    gstin: "27AAACS1429B1Z5",
    city: "Mumbai",
    state: "Maharashtra",
    billingAddress: {
      street: "Plot 42, Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
      country: "India",
    },
    tags: ["Corporate Event", "Printing", "VIP"],
    totalBilled: 220000,
    totalPaid: 160000,
    balanceDue: 60000,
    formattedTotalBilled: "₹2,20,000",
    formattedBalanceDue: "₹60,000",
    invoicesCount: 4,
    quotationsCount: 6,
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "client-2",
    tenantId: "tenant-royal-events",
    name: "ABC Corporation",
    companyName: "ABC Corporation Ltd",
    email: "accounts@abccorp.in",
    phone: "+91 98112 34567",
    gstin: "07AAACB9921E1Z3",
    city: "New Delhi",
    state: "Delhi",
    billingAddress: {
      street: "Level 5, Connaught Place Outer Circle",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India",
    },
    tags: ["Bulk Printing", "Brochures", "Corporate"],
    totalBilled: 145000,
    totalPaid: 120000,
    balanceDue: 25000,
    formattedTotalBilled: "₹1,45,000",
    formattedBalanceDue: "₹25,000",
    invoicesCount: 5,
    quotationsCount: 5,
    createdAt: "2026-02-10T11:30:00.000Z",
  },
  {
    id: "client-3",
    tenantId: "tenant-royal-events",
    name: "Priya Events",
    companyName: "Priya Luxury Weddings & Decor",
    email: "priya@priyaweddings.com",
    phone: "+91 99230 78120",
    gstin: "27BBEPE4419K1Z8",
    city: "Pune",
    state: "Maharashtra",
    billingAddress: {
      street: "18 Koregaon Park South Road",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    },
    tags: ["Wedding Planner", "Floral Decor", "Stage Rig"],
    totalBilled: 380000,
    totalPaid: 365000,
    balanceDue: 15000,
    formattedTotalBilled: "₹3,80,000",
    formattedBalanceDue: "₹15,000",
    invoicesCount: 6,
    quotationsCount: 8,
    createdAt: "2026-03-05T09:15:00.000Z",
  },
  {
    id: "client-4",
    tenantId: "tenant-royal-events",
    name: "Metro Media Works",
    companyName: "Metro Media & Outdoor Ads",
    email: "media@metromediaworks.in",
    phone: "+91 97654 12390",
    gstin: "29AABCM8820P1Z2",
    city: "Bengaluru",
    state: "Karnataka",
    billingAddress: {
      street: "77 Indiranagar 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      country: "India",
    },
    tags: ["Flex Banners", "Vinyl Print", "LED Walls"],
    totalBilled: 95000,
    totalPaid: 80000,
    balanceDue: 15000,
    formattedTotalBilled: "₹95,000",
    formattedBalanceDue: "₹15,000",
    invoicesCount: 3,
    quotationsCount: 4,
    createdAt: "2026-03-20T14:00:00.000Z",
  },
  {
    id: "client-5",
    tenantId: "tenant-royal-events",
    name: "Zenith Studio",
    companyName: "Zenith Creative Studios",
    email: "hello@zenithstudio.in",
    phone: "+91 98450 67890",
    gstin: "29AABFZ1234Q1Z1",
    city: "Bengaluru",
    state: "Karnataka",
    billingAddress: {
      street: "4th Block, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560034",
      country: "India",
    },
    tags: ["Photography", "Exhibition", "Corporate"],
    totalBilled: 180000,
    totalPaid: 180000,
    balanceDue: 0,
    formattedTotalBilled: "₹1,80,000",
    formattedBalanceDue: "₹0",
    invoicesCount: 4,
    quotationsCount: 4,
    createdAt: "2026-04-12T16:30:00.000Z",
  },
  {
    id: "client-6",
    tenantId: "tenant-royal-events",
    name: "Sunil Kapoor",
    companyName: "Kapoor Tech Innovations",
    email: "sunil@kapoortech.example.com",
    phone: "+91 98111 22233",
    gstin: "07AAACK1234F1Z1",
    city: "Gurugram",
    state: "Haryana",
    billingAddress: {
      street: "Tower B, DLF Cyber City",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
    },
    tags: ["Corporate Event", "Printing"],
    totalBilled: 110000,
    totalPaid: 110000,
    balanceDue: 0,
    formattedTotalBilled: "₹1,10,000",
    formattedBalanceDue: "₹0",
    invoicesCount: 2,
    quotationsCount: 3,
    createdAt: "2026-05-01T10:00:00.000Z",
  },
];

import { Client } from "@/types";

export const MOCK_CLIENTS: Client[] = MOCK_CLIENTS_DATA;




