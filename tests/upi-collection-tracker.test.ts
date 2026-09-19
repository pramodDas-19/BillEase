import { describe, it, expect } from "vitest";
import {
  calculateUpiTrackerStats,
  isValidCompletedUpiPayment,
  isPaymentInCurrentMonth,
  UPI_MONTHLY_REFERENCE_THRESHOLD,
} from "@/lib/upi-tracker";
import { Payment } from "@/types";

describe("UPI Collection Tracker Calculation & Validation Engine", () => {
  const currentTenantId = "tenant-enterprise-001";
  const otherTenantId = "tenant-competitor-999";
  // Fixed target date for deterministic calendar month testing (September 2026)
  const targetDate = new Date("2026-09-16T12:00:00");

  const createPayment = (overrides: Partial<Payment> = {}): Payment => ({
    id: `pay-${Math.random().toString(36).substring(7)}`,
    tenantId: currentTenantId,
    paymentNumber: "PAY-2026-001",
    invoiceId: "inv-101",
    invoiceNumber: "INV-2026-001",
    clientId: "client-101",
    clientName: "Acme Corp",
    amount: 10000,
    currency: "INR",
    paymentDate: "2026-09-10",
    paymentMethod: "upi",
    transactionReference: "UPI/123456789",
    status: "completed",
    createdAt: "2026-09-10T10:00:00Z",
    updatedAt: "2026-09-10T10:00:00Z",
    ...overrides,
  });

  // 1. No UPI payments → ₹0 / 0%
  it("Scenario 1: computes empty state with 0 collections (₹0 / 0%)", () => {
    const stats = calculateUpiTrackerStats([], currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(0);
    expect(stats.threshold).toBe(UPI_MONTHLY_REFERENCE_THRESHOLD);
    expect(stats.percentage).toBe(0);
    expect(stats.clampedPercentage).toBe(0);
    expect(stats.statusState).toBe("empty");
    expect(stats.statusText).toBe("No UPI collections recorded this month");
    expect(stats.validPaymentsCount).toBe(0);
  });

  // 2. ₹42,000 UPI payments → 42%
  it("Scenario 2: computes ₹42,000 UPI collections (42% / Currently below ₹1 lakh)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 25000, paymentDate: "2026-09-02" }),
      createPayment({ amount: 17000, paymentDate: "2026-09-08" }),
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(42000);
    expect(stats.percentage).toBe(42);
    expect(stats.clampedPercentage).toBe(42);
    expect(stats.statusState).toBe("below");
    expect(stats.statusText).toBe("Currently below ₹1 lakh");
    expect(stats.validPaymentsCount).toBe(2);
  });

  // 3. ₹75,000 → 75%
  it("Scenario 3: computes ₹75,000 UPI collections (75% / Approaching ₹1 lakh)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 50000, paymentDate: "2026-09-05" }),
      createPayment({ amount: 25000, paymentDate: "2026-09-12" }),
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(75000);
    expect(stats.percentage).toBe(75);
    expect(stats.clampedPercentage).toBe(75);
    expect(stats.statusState).toBe("approaching");
    expect(stats.statusText).toBe("Approaching ₹1 lakh");
  });

  // 4. ₹90,000 → 90%
  it("Scenario 4: computes ₹90,000 UPI collections (90% / Near ₹1 lakh)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 90000, paymentDate: "2026-09-14" }),
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(90000);
    expect(stats.percentage).toBe(90);
    expect(stats.clampedPercentage).toBe(90);
    expect(stats.statusState).toBe("near");
    expect(stats.statusText).toBe("Near ₹1 lakh");
  });

  // 5. ₹1,00,000 → 100%
  it("Scenario 5: computes exactly ₹1,00,000 threshold (100% / Near ₹1 lakh)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 60000, paymentDate: "2026-09-01" }),
      createPayment({ amount: 40000, paymentDate: "2026-09-15" }),
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(100000);
    expect(stats.percentage).toBe(100);
    expect(stats.clampedPercentage).toBe(100);
    expect(stats.statusState).toBe("near");
    expect(stats.statusText).toBe("Near ₹1 lakh");
  });

  // 6. ₹1,25,000 → 125%, visual progress clamped to 100%
  it("Scenario 6: computes ₹1,25,000 exceeded threshold (125% displayed, clamped to 100% width)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 75000, paymentDate: "2026-09-05" }),
      createPayment({ amount: 50000, paymentDate: "2026-09-16" }),
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(125000);
    expect(stats.percentage).toBe(125);
    // Visual progress bar must clamp to 100% and never overflow
    expect(stats.clampedPercentage).toBe(100);
    expect(stats.statusState).toBe("above");
    expect(stats.statusText).toBe("Above ₹1 lakh");
  });

  // 7. Non-UPI payments must NOT be included
  it("Scenario 7: excludes all non-UPI payment methods (cash, bank_transfer, cheque, card)", () => {
    const payments: Payment[] = [
      createPayment({ amount: 30000, paymentMethod: "cash" }),
      createPayment({ amount: 40000, paymentMethod: "bank_transfer" }),
      createPayment({ amount: 20000, paymentMethod: "cheque" }),
      createPayment({ amount: 15000, paymentMethod: "card" as any }),
      createPayment({ amount: 25000, paymentMethod: "upi" }), // only this should be counted
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(25000);
    expect(stats.percentage).toBe(25);
    expect(stats.validPaymentsCount).toBe(1);
  });

  // 8. Payments from previous months must NOT be included
  it("Scenario 8: excludes payments from prior or subsequent calendar months", () => {
    const payments: Payment[] = [
      createPayment({ amount: 50000, paymentDate: "2026-08-31" }), // previous month (August)
      createPayment({ amount: 60000, paymentDate: "2025-09-15" }), // last year
      createPayment({ amount: 40000, paymentDate: "2026-10-01" }), // future month (October)
      createPayment({ amount: 35000, paymentDate: "2026-09-01" }), // valid current month
      createPayment({ amount: 15000, paymentDate: "2026-09-30T23:59:59Z" }), // valid current month end
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(50000); // 35000 + 15000
    expect(stats.percentage).toBe(50);
    expect(stats.validPaymentsCount).toBe(2);
  });

  // 9. Payments belonging to another tenant must NOT be included
  it("Scenario 9: strictly enforces multi-tenant data isolation", () => {
    const payments: Payment[] = [
      createPayment({ amount: 45000, tenantId: currentTenantId }),
      createPayment({ amount: 80000, tenantId: otherTenantId }), // rival tenant
      createPayment({ amount: 20000, tenantId: undefined }), // unassigned tenant
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(45000);
    expect(stats.percentage).toBe(45);
    expect(stats.validPaymentsCount).toBe(1);
  });

  // 10. Invalid/failed payment statuses must not be counted as completed collections
  it("Scenario 10: excludes pending, failed, or refunded payment records", () => {
    const payments: Payment[] = [
      createPayment({ amount: 20000, status: "pending" }),
      createPayment({ amount: 30000, status: "failed" }),
      createPayment({ amount: 15000, status: "refunded" as any }),
      createPayment({ amount: 40000, status: "completed" }), // only valid completed payment
    ];

    const stats = calculateUpiTrackerStats(payments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(40000);
    expect(stats.percentage).toBe(40);
    expect(stats.validPaymentsCount).toBe(1);
  });

  // Edge cases: NaN, negative amounts, null dates
  it("handles edge cases: negative amounts, malformed dates, and missing fields safely", () => {
    const invalidPayments: Payment[] = [
      createPayment({ amount: -5000 }),
      createPayment({ amount: 0 }),
      createPayment({ amount: NaN }),
      createPayment({ paymentDate: "" }),
      createPayment({ paymentDate: null as any }),
      createPayment({ paymentDate: "invalid-date-format" }),
    ];

    const stats = calculateUpiTrackerStats(invalidPayments, currentTenantId, targetDate);

    expect(stats.upiCollected).toBe(0);
    expect(stats.percentage).toBe(0);
    expect(stats.validPaymentsCount).toBe(0);
  });

  // Individual helper tests
  describe("Helper function: isPaymentInCurrentMonth", () => {
    it("returns true for exact YYYY-MM-DD within target month", () => {
      expect(isPaymentInCurrentMonth("2026-09-01", targetDate)).toBe(true);
      expect(isPaymentInCurrentMonth("2026-09-30", targetDate)).toBe(true);
    });

    it("returns true for ISO strings within target month", () => {
      expect(isPaymentInCurrentMonth("2026-09-15T14:30:00.000Z", targetDate)).toBe(true);
    });

    it("returns false for dates in other months or invalid values", () => {
      expect(isPaymentInCurrentMonth("2026-08-31", targetDate)).toBe(false);
      expect(isPaymentInCurrentMonth("2026-10-01", targetDate)).toBe(false);
      expect(isPaymentInCurrentMonth(null, targetDate)).toBe(false);
      expect(isPaymentInCurrentMonth(undefined, targetDate)).toBe(false);
    });
  });

  describe("Helper function: isValidCompletedUpiPayment", () => {
    it("returns true only for valid completed UPI payments belonging to current tenant", () => {
      const valid = createPayment();
      expect(isValidCompletedUpiPayment(valid, currentTenantId)).toBe(true);
    });

    it("handles case-insensitive UPI method string", () => {
      const upperCaseUpi = createPayment({ paymentMethod: "UPI" as any });
      expect(isValidCompletedUpiPayment(upperCaseUpi, currentTenantId)).toBe(true);
    });

    it("rejects non-upi, non-completed, or foreign tenant records", () => {
      expect(isValidCompletedUpiPayment(createPayment({ paymentMethod: "card" as any }), currentTenantId)).toBe(false);
      expect(isValidCompletedUpiPayment(createPayment({ status: "failed" }), currentTenantId)).toBe(false);
      expect(isValidCompletedUpiPayment(createPayment({ tenantId: otherTenantId }), currentTenantId)).toBe(false);
    });
  });
});
