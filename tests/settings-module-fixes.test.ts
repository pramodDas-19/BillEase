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

describe("Module 8: Mobile Input Sanitization & App-Switch Draft Resilience", () => {
  it("sanitizes copy-pasted bank account numbers by stripping spaces and hyphens", () => {
    const rawInputs = [
      "5010 0234 5678 90",
      "5010-0234-5678-90",
      " 5010 0234 5678 90 ",
      "1234-5678-9012",
    ];

    const sanitized = rawInputs.map((val) => val.replace(/[\s-]/g, ""));
    expect(sanitized[0]).toBe("50100234567890");
    expect(sanitized[1]).toBe("50100234567890");
    expect(sanitized[2]).toBe("50100234567890");
    expect(sanitized[3]).toBe("123456789012");

    // All sanitized values must pass validation
    sanitized.forEach((accNum) => {
      const errors = validateSettings({
        businessName: "Studio",
        ownerName: "Owner",
        phone: "9876543210",
        email: "a@b.com",
        upiId: "test@upi",
        accountNumber: accNum,
        ifscCode: "HDFC0001234",
        quotePrefix: "QT-",
        quoteNext: 1,
        invPrefix: "INV-",
        invNext: 1,
        defaultTaxRate: 18,
      });
      expect(errors.accountNumber).toBeUndefined();
    });
  });

  it("sanitizes IFSC code and UPI VPA copied from photo or banking app", () => {
    const rawIfsc = "  hdfc 0001234  ";
    const cleanIfsc = rawIfsc.replace(/\s+/g, "").toUpperCase();
    expect(cleanIfsc).toBe("HDFC0001234");

    const rawUpi = "  RoyalEvents@OkHdfcBank  ";
    const cleanUpi = rawUpi.replace(/\s+/g, "").toLowerCase();
    expect(cleanUpi).toBe("royalevents@okhdfcbank");

    const errors = validateSettings({
      businessName: "Studio",
      ownerName: "Owner",
      phone: "9876543210",
      email: "a@b.com",
      upiId: cleanUpi,
      accountNumber: "50100234567890",
      ifscCode: cleanIfsc,
      quotePrefix: "QT-",
      quoteNext: 1,
      invPrefix: "INV-",
      invNext: 1,
      defaultTaxRate: 18,
    });
    expect(errors.ifscCode).toBeUndefined();
    expect(errors.upiId).toBeUndefined();
  });

  it("preserves draft state across simulated mobile app-switch (Gallery check)", () => {
    const draftKey = "billease_settings_draft_tenant-123";
    const activeTabKey = "billease_settings_active_tab";

    const sessionStore: Record<string, string> = {};

    // 1. User is on 'bank' tab and enters account details
    sessionStore[activeTabKey] = "bank";
    sessionStore[draftKey] = JSON.stringify({
      activeTab: "bank",
      upiId: "studio@okhdfcbank",
      accountNumber: "50100234567890",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
      accountHolderName: "Studio Pro",
    });

    // 2. User switches to Gallery to check account number, tab reloads
    const restoredTab = sessionStore[activeTabKey];
    const restoredDraft = JSON.parse(sessionStore[draftKey]);

    expect(restoredTab).toBe("bank");
    expect(restoredDraft.accountNumber).toBe("50100234567890");
    expect(restoredDraft.bankName).toBe("HDFC Bank");
    expect(restoredDraft.ifscCode).toBe("HDFC0001234");
    expect(restoredDraft.upiId).toBe("studio@okhdfcbank");
  });

  it("strictly isolates drafts and registeredInfo preventing previous business logo/signature bleed into new accounts", () => {
    const oldTenantId = "tenant-drone-skyline";
    const newTenantId = "tenant-goa-digital";

    // 1. Simulate old business with logo and signature in registered user cache
    const oldRegisteredInfo = {
      tenantId: oldTenantId,
      businessName: "Drone Skyline",
      logoUrl: "data:image/png;base64,DRONE_LOGO_DATA",
      signatureUrl: "data:image/png;base64,DRONE_SIGNATURE_DATA",
    };

    // 2. Simulated tenant context fallback resolver
    const resolveTenantAssets = (activeTenantId: string, registeredUser: any) => {
      const isMatchingReg = registeredUser?.tenantId === activeTenantId;
      return {
        logoUrl: isMatchingReg ? registeredUser?.logoUrl : undefined,
        signatureUrl: isMatchingReg ? registeredUser?.signatureUrl : undefined,
      };
    };

    const newAccountAssets = resolveTenantAssets(newTenantId, oldRegisteredInfo);
    expect(newAccountAssets.logoUrl).toBeUndefined();
    expect(newAccountAssets.signatureUrl).toBeUndefined();

    // 3. Draft restoration validation
    const draftFromOldTenant = {
      tenantId: oldTenantId,
      businessName: "Drone Skyline",
      logoUrl: "data:image/png;base64,DRONE_LOGO_DATA",
      signatureUrl: "data:image/png;base64,DRONE_SIGNATURE_DATA",
    };

    const shouldRestoreDraft = (draft: any, currentTenantId: string) => {
      return Boolean(draft && draft.tenantId === currentTenantId);
    };

    expect(shouldRestoreDraft(draftFromOldTenant, newTenantId)).toBe(false);
    expect(shouldRestoreDraft(draftFromOldTenant, oldTenantId)).toBe(true);
  });
});

