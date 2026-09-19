import { Payment } from "@/types";

export const UPI_MONTHLY_REFERENCE_THRESHOLD = 100_000; // ₹1,00,000

export type UpiTrackerStatusState = "empty" | "below" | "approaching" | "near" | "above";

export interface UpiTrackerStats {
  upiCollected: number;
  threshold: number;
  percentage: number;
  clampedPercentage: number;
  statusState: UpiTrackerStatusState;
  statusText: string;
  statusDotColor: string;
  statusBadgeColor: string;
  validPaymentsCount: number;
}

/**
 * Checks whether a payment falls into the specified calendar month (default: current month).
 * Uses local calendar date matching on YYYY-MM-DD to avoid timezone boundary issues.
 */
export function isPaymentInCurrentMonth(
  paymentDateStr: string | undefined | null,
  targetDate: Date = new Date()
): boolean {
  if (!paymentDateStr) return false;

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth(); // 0-indexed: 0 = Jan, 8 = Sep

  // Handle YYYY-MM-DD or ISO strings
  const datePart = paymentDateStr.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // 0-indexed
    return y === targetYear && m === targetMonth;
  }

  const parsed = new Date(paymentDateStr);
  return (
    !isNaN(parsed.getTime()) &&
    parsed.getFullYear() === targetYear &&
    parsed.getMonth() === targetMonth
  );
}

/**
 * Validates whether a payment record is an authenticated, completed UPI payment.
 */
export function isValidCompletedUpiPayment(payment: Payment, tenantId?: string): boolean {
  if (!payment) return false;

  // Enforce multi-tenant isolation if tenantId is provided
  if (tenantId && payment.tenantId !== tenantId) {
    return false;
  }

  // Payment method must be UPI (case-insensitive)
  if (payment.paymentMethod?.toLowerCase() !== "upi") {
    return false;
  }

  // Only completed/successful payments count towards collections
  if (payment.status !== "completed") {
    return false;
  }

  // Amount must be a valid positive number
  if (typeof payment.amount !== "number" || isNaN(payment.amount) || payment.amount <= 0) {
    return false;
  }

  return true;
}

/**
 * Computes monthly UPI collection statistics against the ₹1,00,000 reference threshold.
 */
export function calculateUpiTrackerStats(
  payments: Payment[],
  tenantId?: string,
  targetDate: Date = new Date(),
  threshold: number = UPI_MONTHLY_REFERENCE_THRESHOLD
): UpiTrackerStats {
  const safeList = Array.isArray(payments) ? payments : [];

  const validPayments = safeList.filter((p) => {
    return (
      isValidCompletedUpiPayment(p, tenantId) &&
      isPaymentInCurrentMonth(p.paymentDate, targetDate)
    );
  });

  const upiCollected = validPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const rawPercentage = (upiCollected / threshold) * 100;
  const percentage = Math.round(rawPercentage);
  // Clamped strictly between 0 and 100 for visual progress indicators
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  let statusState: UpiTrackerStatusState = "below";
  let statusText = "Currently below ₹1 lakh";
  let statusDotColor = "bg-emerald-500";
  let statusBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200/80";

  if (upiCollected === 0) {
    statusState = "empty";
    statusText = "No UPI collections recorded this month";
    statusDotColor = "bg-emerald-500";
    statusBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200/80";
  } else if (rawPercentage <= 70) {
    statusState = "below";
    statusText = "Currently below ₹1 lakh";
    statusDotColor = "bg-emerald-500";
    statusBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200/80";
  } else if (rawPercentage < 90) {
    statusState = "approaching";
    statusText = "Approaching ₹1 lakh";
    statusDotColor = "bg-amber-500";
    statusBadgeColor = "text-amber-700 bg-amber-50 border-amber-200/80";
  } else if (rawPercentage <= 100) {
    statusState = "near";
    statusText = "Near ₹1 lakh";
    statusDotColor = "bg-amber-600";
    statusBadgeColor = "text-amber-800 bg-amber-100 border-amber-300/80";
  } else {
    statusState = "above";
    statusText = "Above ₹1 lakh";
    statusDotColor = "bg-rose-500";
    statusBadgeColor = "text-rose-700 bg-rose-50 border-rose-200/80";
  }

  return {
    upiCollected,
    threshold,
    percentage,
    clampedPercentage,
    statusState,
    statusText,
    statusDotColor,
    statusBadgeColor,
    validPaymentsCount: validPayments.length,
  };
}
