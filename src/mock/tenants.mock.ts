import { Tenant, User } from "@/types";

export const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant-royal-events",
    businessName: "Royal Event Planners & Print Studio",
    slug: "royal-events",
    businessType: "hybrid_event_and_print",
    ownerName: "Rajesh Sharma",
    email: "contact@royalevents.com",
    phone: "+91 98765 43210",
    website: "https://royalevents.example.com",
    logoUrl: "",
    address: {
      street: "Plot 42, Sector 18, Commercial Hub",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122001",
      country: "India",
    },
    gstin: "07AAAAA0000A1Z5", // Optional
    pan: "AAAAA0000A",
    bankDetails: {
      accountName: "Royal Event Planners LLP",
      accountNumber: "50200012345678",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      branch: "Sector 18 Branch",
      upiId: "royalevents@hdfcbank",
    },
    settings: {
      defaultCurrency: "INR",
      quotationNumbering: { prefix: "QT-", nextNumber: 1045, digitLength: 4 },
      invoiceNumbering: { prefix: "INV-", nextNumber: 1024, digitLength: 4 },
      defaultTaxRate: 18,
      enableGstByDefault: true,
      defaultQuotationValidityDays: 15,
      defaultInvoiceDueDays: 15,
      defaultTermsAndConditions: "1. 50% advance to initiate work.\n2. Balance on delivery/event day.",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "tenant-pixel-print",
    businessName: "Pixel Craft Graphic & Printing Co.",
    slug: "pixel-craft",
    businessType: "printing_press",
    ownerName: "Anita Verma",
    email: "orders@pixelcraft.example.com",
    phone: "+91 91234 56789",
    website: "https://pixelcraft.example.com",
    address: {
      street: "12 Industrial Area, Phase II",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560058",
      country: "India",
    },
    // No GSTIN entered (demonstrating optional GSTIN workflow)
    settings: {
      defaultCurrency: "INR",
      quotationNumbering: { prefix: "PC-QT-", nextNumber: 501, digitLength: 4 },
      invoiceNumbering: { prefix: "PC-INV-", nextNumber: 301, digitLength: 4 },
      enableGstByDefault: false,
      defaultQuotationValidityDays: 30,
      defaultInvoiceDueDays: 7,
    },
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    tenantId: "tenant-royal-events",
    email: "rajesh@royalevents.com",
    name: "Rajesh Sharma",
    role: "owner",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];
