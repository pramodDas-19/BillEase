import { Tenant, User } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "user-pramod",
    name: "Pramod Das",
    email: "contact@royalevents.com",
    role: "owner",
    tenantId: "tenant-royal-events",
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant-royal-events",
    businessName: "My Studio & Events",
    slug: "my-studio-events",
    businessType: "hybrid_event_and_print",
    ownerName: "Pramod Das",
    email: "contact@mystudio.com",
    phone: "+91 98765 43210",
    gstin: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    bankDetails: {
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branch: "",
      upiId: "",
    },
    settings: {
      defaultCurrency: "INR",
      defaultTaxRate: 18,
      enableGstByDefault: false,
      defaultQuotationValidityDays: 14,
      defaultInvoiceDueDays: 14,
      quotationNumbering: {
        prefix: "QT-",
        nextNumber: 1001,
        digitLength: 4,
      },
      invoiceNumbering: {
        prefix: "INV-",
        nextNumber: 1001,
        digitLength: 4,
      },
      defaultTermsAndConditions:
        "1. 50% advance to initiate work.\n2. Remaining balance on delivery or event day.\n3. Taxes as applicable.",
      defaultQuotationNotes: "Thank you for your business!",
      defaultInvoiceNotes: "Thank you for your business!",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
