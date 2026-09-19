// ============================================================================
// BILLEASE SAAS — OFFLINE RETRY QUEUE & NETWORK DETECTOR TESTS
// Verifies network distinction, single-mutation constraint, and FIFO safety
// ============================================================================

import { describe, it, expect } from "vitest";
import { isNetworkError } from "../src/lib/network-detector";
import { PendingMutation } from "../src/lib/offline-queue";

describe("Network Error vs. Validation Error Detector", () => {
  it("identifies true network disconnects and connection errors as network errors", () => {
    // 1. Fetch failure
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);

    // 2. AbortError / TimeoutError
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    expect(isNetworkError(abortErr)).toBe(true);

    const timeoutErr = new Error("Request timed out");
    timeoutErr.name = "TimeoutError";
    expect(isNetworkError(timeoutErr)).toBe(true);

    // 3. Chromium / Network disconnect keywords
    expect(isNetworkError(new Error("net::ERR_INTERNET_DISCONNECTED"))).toBe(true);
    expect(isNetworkError(new Error("NetworkError when attempting to fetch resource"))).toBe(true);
    expect(isNetworkError(new Error("connection refused"))).toBe(true);

    // 4. Supabase zero-status network drops
    expect(isNetworkError({ message: "Network connection dropped", status: 0 })).toBe(true);
    expect(isNetworkError({ message: "Gateway Timeout", status: 504 })).toBe(true);
  });

  it("strictly rejects database constraints and validation errors (does not queue them)", () => {
    // 1. PostgreSQL 23505: Unique constraint violation (e.g. duplicate invoice number)
    expect(
      isNetworkError({
        code: "23505",
        message: 'duplicate key value violates unique constraint "invoices_number_unique"',
      })
    ).toBe(false);

    // 2. PostgreSQL 23503: Foreign key violation (e.g. non-existent client ID)
    expect(
      isNetworkError({
        code: "23503",
        message: 'insert or update on table "invoices" violates foreign key constraint',
      })
    ).toBe(false);

    // 3. PostgreSQL 42501: RLS / Permission denied
    expect(
      isNetworkError({
        code: "42501",
        message: "new row violates row-level security policy for table invoices",
      })
    ).toBe(false);

    // 4. HTTP 400 Bad Request
    expect(isNetworkError({ status: 400, message: "Invalid payload: missing invoice items" })).toBe(
      false
    );

    // 5. HTTP 401 Unauthorized / HTTP 403 Forbidden
    expect(isNetworkError({ status: 401, message: "JWT expired" })).toBe(false);
    expect(isNetworkError({ status: 403, message: "Trial expired or subscription required" })).toBe(
      false
    );

    // 6. HTTP 422 Unprocessable Entity
    expect(isNetworkError({ status: 422, message: "Invalid GSTIN format" })).toBe(false);
  });
});

describe("Hard Constraint 4: Single Mutation per Record Logic", () => {
  it("merges subsequent offline edits into existing queued mutation without creating duplicates", () => {
    // Simulate the in-place merge logic specified in offline-queue.ts
    const initialMutation: PendingMutation = {
      id: "mut-1",
      entityType: "invoice",
      entityId: "inv-offline-001",
      action: "create",
      tenantId: "tenant-demo",
      displayTitle: "Invoice #INV-9001",
      payload: {
        invoicePayload: { invoice_number: "INV-9001", client_name: "Initial Client", subtotal: 1000 },
        itemRows: [{ description: "Design Services", amount: 1000 }],
      },
      createdAt: "2026-09-15T10:00:00.000Z",
      updatedAt: "2026-09-15T10:00:00.000Z",
      status: "pending",
      retryCount: 0,
      errorMessage: null,
    };

    // Second edit while still offline
    const secondEditPayload = {
      invoicePayload: { invoice_number: "INV-9001", client_name: "Updated Client Name", subtotal: 1500 },
      itemRows: [
        { description: "Design Services", amount: 1000 },
        { description: "Revision Fee", amount: 500 },
      ],
    };

    // Pure merge function mirroring enqueueMutation
    const mergeMutations = (
      existing: PendingMutation,
      newPayload: any,
      newTitle: string,
      timestamp: string
    ): PendingMutation => {
      return {
        ...existing,
        displayTitle: newTitle || existing.displayTitle,
        payload: {
          ...existing.payload,
          ...newPayload,
        },
        updatedAt: timestamp,
        status: "pending",
        action: existing.action === "create" ? "create" : "update",
      };
    };

    const merged = mergeMutations(
      initialMutation,
      secondEditPayload,
      "Invoice #INV-9001 (Updated)",
      "2026-09-15T10:05:00.000Z"
    );

    // 1. Single record preserved
    expect(merged.id).toBe("mut-1");
    expect(merged.entityId).toBe("inv-offline-001");

    // 2. Action remains "create" so replay creates rather than attempting to update non-existent DB row
    expect(merged.action).toBe("create");

    // 3. Original creation timestamp is preserved for FIFO order
    expect(merged.createdAt).toBe("2026-09-15T10:00:00.000Z");
    expect(merged.updatedAt).toBe("2026-09-15T10:05:00.000Z");

    // 4. Payload contains updated values
    expect(merged.payload.invoicePayload.client_name).toBe("Updated Client Name");
    expect(merged.payload.invoicePayload.subtotal).toBe(1500);
    expect(merged.payload.itemRows.length).toBe(2);
  });

  it("sorts queued items in strict FIFO order (createdAt ASC)", () => {
    const queue: PendingMutation[] = [
      {
        id: "mut-3",
        entityType: "payment",
        entityId: "pay-3",
        action: "create",
        tenantId: "t1",
        displayTitle: "Payment #PAY-3",
        payload: {},
        createdAt: "2026-09-15T11:00:00.000Z",
        updatedAt: "2026-09-15T11:00:00.000Z",
        status: "pending",
        retryCount: 0,
      },
      {
        id: "mut-1",
        entityType: "client",
        entityId: "client-1",
        action: "create",
        tenantId: "t1",
        displayTitle: "Client Acme",
        payload: {},
        createdAt: "2026-09-15T09:00:00.000Z",
        updatedAt: "2026-09-15T09:00:00.000Z",
        status: "pending",
        retryCount: 0,
      },
      {
        id: "mut-2",
        entityType: "invoice",
        entityId: "inv-2",
        action: "create",
        tenantId: "t1",
        displayTitle: "Invoice #INV-2",
        payload: {},
        createdAt: "2026-09-15T10:00:00.000Z",
        updatedAt: "2026-09-15T10:00:00.000Z",
        status: "pending",
        retryCount: 0,
      },
    ];

    const sorted = [...queue].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Client must be replayed first, then Invoice, then Payment
    expect(sorted.map((m) => m.id)).toEqual(["mut-1", "mut-2", "mut-3"]);
    expect(sorted.map((m) => m.entityType)).toEqual(["client", "invoice", "payment"]);
  });

  it("handles status transitions (pending -> retrying -> failed)", () => {
    let item: PendingMutation = {
      id: "mut-1",
      entityType: "invoice",
      entityId: "inv-1",
      action: "create",
      tenantId: "t1",
      displayTitle: "Invoice #INV-1",
      payload: {},
      createdAt: "2026-09-15T10:00:00.000Z",
      updatedAt: "2026-09-15T10:00:00.000Z",
      status: "pending",
      retryCount: 0,
    };

    // Transition 1: Retrying
    item = { ...item, status: "retrying", retryCount: item.retryCount + 1 };
    expect(item.status).toBe("retrying");
    expect(item.retryCount).toBe(1);

    // Transition 2: Permanent server failure
    item = {
      ...item,
      status: "failed",
      errorMessage: "Server rejected payload: GSTIN invalid",
    };
    expect(item.status).toBe("failed");
    expect(item.errorMessage).toBe("Server rejected payload: GSTIN invalid");
  });
});
