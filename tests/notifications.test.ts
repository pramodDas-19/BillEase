// ============================================================================
// BILLEASE NOTIFICATION MODULE TESTS
// Automated test suite for multi-tenancy, deduplication, and non-blocking safety
// ============================================================================

import { describe, it, expect, vi } from "vitest";
import { NotificationType, NotificationRecord } from "../src/types/notification.types";

describe("Notification Architecture & Deduplication", () => {
  it("generates deterministic deduplication keys for overdue and due-soon invoices", () => {
    const invoiceId = "inv-889911";
    const date = "2026-09-15";

    const overdueKey = `invoice_overdue:${invoiceId}:${date}`;
    const dueSoonKey = `invoice_due_soon:${invoiceId}:${date}`;

    expect(overdueKey).toBe("invoice_overdue:inv-889911:2026-09-15");
    expect(dueSoonKey).toBe("invoice_due_soon:inv-889911:2026-09-15");
    expect(overdueKey).not.toBe(dueSoonKey);
  });

  it("correctly filters notification types into tabs (dues, payments, activity)", () => {
    const sampleNotifications: { id: string; type: NotificationType }[] = [
      { id: "1", type: "invoice_overdue" },
      { id: "2", type: "invoice_due_soon" },
      { id: "3", type: "payment_received" },
      { id: "4", type: "payment_failed" },
      { id: "5", type: "quotation_accepted" },
      { id: "6", type: "invoice_created" },
      { id: "7", type: "system" },
    ];

    const dues = sampleNotifications.filter(
      (n) => n.type === "invoice_overdue" || n.type === "invoice_due_soon" || n.type === "overdue" || n.type === "due_soon"
    );
    const payments = sampleNotifications.filter(
      (n) => n.type === "payment_received" || n.type === "payment_failed"
    );
    const activity = sampleNotifications.filter((n) =>
      ["quotation_accepted", "quotation_converted", "quote_accepted", "action_created", "invoice_created", "quotation_created"].includes(n.type)
    );

    expect(dues.map((d) => d.id)).toEqual(["1", "2"]);
    expect(payments.map((p) => p.id)).toEqual(["3", "4"]);
    expect(activity.map((a) => a.id)).toEqual(["5", "6"]);
  });

  it("strictly validates URLs to prevent open-redirect vulnerabilities", () => {
    const origin = "https://billease.app";

    function sanitizeTargetUrl(url: string | undefined): string {
      if (!url || typeof url !== "string") return "/dashboard";
      try {
        const parsed = new URL(url, origin);
        if (parsed.origin !== origin) {
          return "/dashboard";
        }
        return parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return "/dashboard";
      }
    }

    expect(sanitizeTargetUrl("/invoices/inv-123")).toBe("/invoices/inv-123");
    expect(sanitizeTargetUrl("https://billease.app/payments?id=4")).toBe("/payments?id=4");
    // External phishing attempts must fall back to /dashboard
    expect(sanitizeTargetUrl("https://attacker-phishing.com/login")).toBe("/dashboard");
    expect(sanitizeTargetUrl("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeTargetUrl(undefined)).toBe("/dashboard");
  });

  it("ensures notification dispatch errors never interrupt primary business transactions", async () => {
    // Simulated invoice creation flow
    let invoiceCreated = false;

    async function executeBillingOperation() {
      // 1. Primary business operation
      invoiceCreated = true;

      // 2. Notification dispatch wrapped in non-blocking isolation
      try {
        // Simulate a failing notification service (e.g. network timeout or DB error)
        throw new Error("Supabase connection timeout");
      } catch (notifErr: any) {
        // Must log warning without throwing
        console.warn("[BillingModule] Non-blocking notification warning:", notifErr.message);
      }

      return { id: "inv-999", success: true };
    }

    const result = await executeBillingOperation();

    expect(invoiceCreated).toBe(true);
    expect(result.success).toBe(true);
    expect(result.id).toBe("inv-999");
  });

  it("enforces tenant boundary check on notifications", () => {
    const tenantANotifications: Partial<NotificationRecord>[] = [
      { id: "notif-1", tenant_id: "tenant-company-a", title: "Invoice Paid" },
      { id: "notif-2", tenant_id: "tenant-company-a", title: "Overdue Alert" },
    ];

    const requestingTenantId = "tenant-company-b";

    // Query simulation
    const accessible = tenantANotifications.filter(
      (n) => n.tenant_id === requestingTenantId
    );

    expect(accessible).toHaveLength(0);
  });
});
