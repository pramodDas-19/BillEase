import { describe, it, expect } from "vitest";
import { computeChecklistState, getChecklistProgress, getChecklistItems } from "../src/lib/onboarding";
import { Tenant } from "../src/types";

describe("Onboarding Checklist Logic", () => {
  const mockTenant: Tenant = {
    id: "tenant-1",
    businessName: "Design Studio",
    ownerName: "Pramod Das",
    email: "pramod@example.com",
    phone: "+919876543210",
    slug: "design-studio",
    businessType: "graphic_designer",
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
    address: {
      street: "123 Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India",
    },
    bankDetails: {
      bankName: "HDFC Bank",
      accountNumber: "1234567890",
      ifscCode: "HDFC0001234",
      branch: "Fort",
      upiId: "studio@okaxis",
    },
    subscription: {
      plan: "trial",
      status: "trial_active",
      trialStartDate: "2026-09-08T10:00:00.000Z",
      trialEndDate: "2026-09-15T10:00:00.000Z",
    },
    settings: {
      defaultCurrency: "INR",
      quotationNumbering: { prefix: "QT-", nextNumber: 1, digitLength: 4 },
      invoiceNumbering: { prefix: "INV-", nextNumber: 1, digitLength: 4 },
      enableGstByDefault: false,
      defaultQuotationValidityDays: 15,
      defaultInvoiceDueDays: 15,
    },
  };

  it("evaluates all steps incomplete when fresh tenant has no UPI/city and 0 counts", () => {
    const emptyTenant: Tenant = {
      ...mockTenant,
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branch: "",
        upiId: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    };

    const state = computeChecklistState(emptyTenant, 0, 0, 0, 0);
    expect(state.businessDetailsComplete).toBe(false);
    expect(state.hasFirstClient).toBe(false);
    expect(state.hasFirstDocument).toBe(false);
    expect(state.hasSentPaymentLink).toBe(false);

    expect(getChecklistProgress(state)).toBe(0);
    const items = getChecklistItems(state);
    expect(items.every((i) => !i.isCompleted)).toBe(true);
  });

  it("marks businessDetailsComplete when UPI ID and city are present", () => {
    const state = computeChecklistState(mockTenant, 0, 0, 0, 0);
    expect(state.businessDetailsComplete).toBe(true);
    expect(state.hasFirstClient).toBe(false);
    expect(getChecklistProgress(state)).toBe(1);
  });

  it("marks hasFirstClient when clientCount > 0", () => {
    const state = computeChecklistState(mockTenant, 1, 0, 0, 0);
    expect(state.hasFirstClient).toBe(true);
    expect(getChecklistProgress(state)).toBe(2);
  });

  it("marks hasFirstDocument when invoiceCount > 0 or quotationCount > 0", () => {
    const stateWithQuote = computeChecklistState(mockTenant, 1, 0, 1, 0);
    expect(stateWithQuote.hasFirstDocument).toBe(true);

    const stateWithInv = computeChecklistState(mockTenant, 1, 1, 0, 0);
    expect(stateWithInv.hasFirstDocument).toBe(true);
    expect(stateWithInv.hasSentPaymentLink).toBe(true); // invoice triggers payment link readiness
  });

  it("evaluates 4/4 completion when all milestones are met", () => {
    const state = computeChecklistState(mockTenant, 3, 2, 1, 1);
    expect(state.businessDetailsComplete).toBe(true);
    expect(state.hasFirstClient).toBe(true);
    expect(state.hasFirstDocument).toBe(true);
    expect(state.hasSentPaymentLink).toBe(true);

    expect(getChecklistProgress(state)).toBe(4);
    const items = getChecklistItems(state);
    expect(items.every((i) => i.isCompleted)).toBe(true);
  });
});
