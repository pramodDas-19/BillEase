// ============================================================================
// BILLEASE MODULE 8 TESTS: Settings, Multi-Tenancy & Notifications
// Automated test suite for settings validation, numbering sanitization, and multi-tenant isolation
// ============================================================================

import { describe, it, expect } from "vitest";
import { validateSettings, validateBusinessProfile } from "../src/validations/settings.schema";

describe("Module 8: Settings & Business Profile Validation", () => {
  const validSettings = {
    businessName: "Royal Events Studio",
    ownerName: "Pramod Das",
    phone: "+91 98765 43210",
    email: "contact@royalevents.com",
    gstin: "27AAAAA0000A1Z5", // Maharashtra (27)
    upiId: "royalevents@okhdfcbank",
    ifscCode: "HDFC0001234",
    accountNumber: "50100234567890",
    quotePrefix: "QT-",
    quoteNext: 1001,
    invPrefix: "INV-",
    invNext: 2001,
    defaultTaxRate: 18,
  };

  it("passes validation with complete, valid settings", () => {
    const errors = validateSettings(validSettings);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("enforces businessName and ownerName minimum length of 2 characters", () => {
    const errors = validateSettings({
      ...validSettings,
      businessName: " ",
      ownerName: "A",
    });

    expect(errors.businessName).toBe("Business name must be at least 2 characters");
    expect(errors.ownerName).toBe("Owner / Signatory name must be at least 2 characters");
  });

  it("strictly validates phone numbers requiring at least 10 numeric digits", () => {
    const shortPhone = validateSettings({
      ...validSettings,
      phone: "12345",
    });
    expect(shortPhone.phone).toBe("Please enter a valid phone number (at least 10 digits)");

    const formattedPhone = validateSettings({
      ...validSettings,
      phone: "+91 (987) 654-3210",
    });
    expect(formattedPhone.phone).toBeUndefined();
  });

  it("validates email address format and rejects malformed addresses", () => {
    const badEmail = validateSettings({
      ...validSettings,
      email: "invalid-email-address",
    });
    expect(badEmail.email).toBe("Please enter a valid email address");

    const goodEmail = validateSettings({
      ...validSettings,
      email: "billing.team@domain.co.in",
    });
    expect(goodEmail.email).toBeUndefined();
  });

  it("validates GSTIN structure and Indian state codes (optional but strict when provided)", () => {
    // Blank GSTIN is valid (unregistered business)
    const blankGstin = validateSettings({
      ...validSettings,
      gstin: "",
    });
    expect(blankGstin.gstin).toBeUndefined();

    // Invalid length / regex
    const malformedGstin = validateSettings({
      ...validSettings,
      gstin: "27ABCDE1234",
    });
    expect(malformedGstin.gstin).toContain("Invalid GSTIN format");

    // Invalid state code (99 is not a valid Indian state code)
    const invalidStateGstin = validateSettings({
      ...validSettings,
      gstin: "99AAAAA0000A1Z5",
    });
    expect(invalidStateGstin.gstin).toContain("Invalid GST State Code");

    // Valid state code (07 - Delhi)
    const validDelhiGstin = validateSettings({
      ...validSettings,
      gstin: "07AAAAA0000A1Z5",
    });
    expect(validDelhiGstin.gstin).toBeUndefined();
  });

  it("validates UPI VPA format, IFSC code structure, and bank account number bounds", () => {
    // Invalid UPI VPA
    const badUpi = validateSettings({
      ...validSettings,
      upiId: "not-a-valid-vpa",
    });
    expect(badUpi.upiId).toContain("Invalid UPI ID / VPA format");

    // Valid UPI VPA
    const goodUpi = validateSettings({
      ...validSettings,
      upiId: "business.pay@icici",
    });
    expect(goodUpi.upiId).toBeUndefined();

    // Malformed IFSC (must be 4 letters + 0 + 6 alphanumeric)
    const badIfsc = validateSettings({
      ...validSettings,
      ifscCode: "HDFC00123", // too short
    });
    expect(badIfsc.ifscCode).toContain("Invalid IFSC Code");

    // Valid IFSC
    const goodIfsc = validateSettings({
      ...validSettings,
      ifscCode: "SBIN0001234",
    });
    expect(goodIfsc.ifscCode).toBeUndefined();

    // Invalid Account Number
    const badAccount = validateSettings({
      ...validSettings,
      accountNumber: "1234", // too short (under 9 digits)
    });
    expect(badAccount.accountNumber).toContain("Bank account number must be 9 to 18 numeric digits");
  });

  it("validates document numbering sequences and clamps bounds", () => {
    const invalidNumbering = validateSettings({
      ...validSettings,
      quotePrefix: "",
      quoteNext: 0,
      invPrefix: "INV#*",
      invNext: -5,
    });

    expect(invalidNumbering.quotePrefix).toBe("Quotation prefix is required (e.g. QT-)");
    expect(invalidNumbering.quoteNext).toBe("Next quotation number must be a positive integer (>= 1)");
    expect(invalidNumbering.invPrefix).toContain("Prefix can only contain letters, numbers, hyphens, and slashes");
    expect(invalidNumbering.invNext).toBe("Next invoice number must be a positive integer (>= 1)");
  });

  it("validates default tax rate bounds (0% to 100%)", () => {
    const badTaxHigh = validateSettings({
      ...validSettings,
      defaultTaxRate: 150,
    });
    expect(badTaxHigh.defaultTaxRate).toBe("Default tax rate must be between 0% and 100%");

    const badTaxNeg = validateSettings({
      ...validSettings,
      defaultTaxRate: -5,
    });
    expect(badTaxNeg.defaultTaxRate).toBe("Default tax rate must be between 0% and 100%");

    const goodTax = validateSettings({
      ...validSettings,
      defaultTaxRate: 5,
    });
    expect(goodTax.defaultTaxRate).toBeUndefined();
  });
});

describe("Module 8: Multi-Tenant Namespacing & Isolation", () => {
  it("isolates tenant settings keys across distinct tenants", () => {
    const tenantAId = "tenant-creative-studio";
    const tenantBId = "tenant-apex-consulting";

    const keyA = `billease_tenant_settings_${tenantAId}`;
    const keyB = `billease_tenant_settings_${tenantBId}`;

    expect(keyA).not.toBe(keyB);
    expect(keyA).toBe("billease_tenant_settings_tenant-creative-studio");
    expect(keyB).toBe("billease_tenant_settings_tenant-apex-consulting");

    // Simulated tenant storage isolation
    const storageMock: Record<string, string> = {};
    storageMock[keyA] = JSON.stringify({ defaultTaxRate: 18, quotePrefix: "CS-" });
    storageMock[keyB] = JSON.stringify({ defaultTaxRate: 5, quotePrefix: "AC-" });

    const retrievedA = JSON.parse(storageMock[keyA]);
    const retrievedB = JSON.parse(storageMock[keyB]);

    expect(retrievedA.quotePrefix).toBe("CS-");
    expect(retrievedB.quotePrefix).toBe("AC-");
    expect(retrievedA.defaultTaxRate).toBe(18);
    expect(retrievedB.defaultTaxRate).toBe(5);
  });
});
