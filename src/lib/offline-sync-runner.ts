// ============================================================================
// BILLEASE SAAS — OFFLINE SYNC RUNNER
// Replays queued IndexedDB mutations in FIFO order upon network reconnection
// ============================================================================

import {
  getPendingMutations,
  removeMutation,
  updateMutationStatus,
  PendingMutation,
} from "./offline-queue";
import { isNetworkError } from "./network-detector";
import { supabase } from "./supabase/client";

let isSyncRunning = false;
let isInitialized = false;

/**
 * Executes a single queued mutation directly against Supabase
 */
async function replayMutation(item: PendingMutation): Promise<{ success: boolean; error?: any }> {
  try {
    switch (item.entityType) {
      case "invoice": {
        if (item.action === "create") {
          const { invoicePayload, itemRows } = item.payload;
          const { error: invError } = await supabase.from("invoices").insert(invoicePayload);
          if (invError) throw invError;

          if (itemRows && itemRows.length > 0) {
            const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
            if (itemsError) console.warn("[OfflineSync] invoice_items insert error:", itemsError);
          }
        } else {
          // update
          const { id, invPayload, itemRows } = item.payload;
          const { error: invError } = await supabase.from("invoices").update(invPayload).eq("id", id);
          if (invError) throw invError;

          if (itemRows && itemRows.length > 0) {
            await supabase.from("invoice_items").delete().eq("invoice_id", id);
            await supabase.from("invoice_items").insert(itemRows);
          }
        }
        return { success: true };
      }

      case "quotation": {
        if (item.action === "create") {
          const { quotePayload, itemRows } = item.payload;
          const { error: qError } = await supabase.from("quotations").insert(quotePayload);
          if (qError) throw qError;

          if (itemRows && itemRows.length > 0) {
            await supabase.from("quotation_items").insert(itemRows);
          }
        } else {
          const { id, quotePayload, itemRows } = item.payload;
          const { error: qError } = await supabase.from("quotations").update(quotePayload).eq("id", id);
          if (qError) throw qError;

          if (itemRows && itemRows.length > 0) {
            await supabase.from("quotation_items").delete().eq("quotation_id", id);
            await supabase.from("quotation_items").insert(itemRows);
          }
        }
        return { success: true };
      }

      case "payment": {
        const { paymentPayload, invoiceId, newBalance, newStatus, newPaid } = item.payload;
        const { error: pError } = await supabase.from("payments").insert(paymentPayload);
        if (pError) throw pError;

        if (invoiceId && newBalance !== undefined) {
          const updatePayload: Record<string, any> = {
            balance_due: newBalance,
            status: newStatus,
            updated_at: new Date().toISOString(),
          };
          if (newPaid !== undefined) {
            updatePayload.paid_amount = newPaid;
          }
          await supabase
            .from("invoices")
            .update(updatePayload)
            .eq("id", invoiceId);
        }
        return { success: true };
      }

      case "client": {
        if (item.action === "create") {
          const { clientPayload } = item.payload;
          const { error: cError } = await supabase.from("clients").insert(clientPayload);
          if (cError) throw cError;
        } else {
          const { id, clientPayload } = item.payload;
          const { error: cError } = await supabase.from("clients").update(clientPayload).eq("id", id);
          if (cError) throw cError;
        }
        return { success: true };
      }

      default:
        return { success: false, error: new Error(`Unknown entity type: ${item.entityType}`) };
    }
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/**
 * Runs the sync process for all pending mutations in FIFO order
 */
export async function runOfflineSync(): Promise<{
  synced: number;
  failed: number;
  pendingRemaining: number;
}> {
  if (isSyncRunning) {
    return { synced: 0, failed: 0, pendingRemaining: 0 };
  }

  if (typeof window !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, pendingRemaining: 0 };
  }

  isSyncRunning = true;
  let synced = 0;
  let failed = 0;

  try {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) {
      return { synced: 0, failed: 0, pendingRemaining: 0 };
    }

    console.info(`[OfflineSync] Replaying ${mutations.length} queued mutations in FIFO order...`);

    for (const item of mutations) {
      // Check network status before each replay
      if (typeof window !== "undefined" && !navigator.onLine) {
        console.warn("[OfflineSync] Network dropped during sync. Halting queue replay.");
        break;
      }

      await updateMutationStatus(item.id, "retrying");
      const result = await replayMutation(item);

      if (result.success) {
        await removeMutation(item.id);
        synced++;
        console.info(`[OfflineSync] Successfully synced ${item.entityType} (${item.displayTitle})`);
      } else {
        const isNet = isNetworkError(result.error);
        if (isNet) {
          // Reset to pending and pause
          await updateMutationStatus(item.id, "pending", "Network connection lost during sync.");
          console.warn(`[OfflineSync] Network error on ${item.entityType}. Pausing sync.`);
          break;
        } else {
          // Permanent validation or server error
          failed++;
          const errorMsg = result.error?.message || "Server rejected this operation.";
          await updateMutationStatus(item.id, "failed", errorMsg);
          console.error(`[OfflineSync] Permanent failure on ${item.entityType}:`, errorMsg);
        }
      }
    }

    if (synced > 0 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("billease:data-synced"));
    }

    const remaining = await getPendingMutations();
    return { synced, failed, pendingRemaining: remaining.length };
  } finally {
    isSyncRunning = false;
  }
}

/**
 * Initializes automatic sync listeners on the client (idempotent)
 */
export function initOfflineSyncListeners() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  window.addEventListener("online", () => {
    console.info("[OfflineSync] Device is back online. Triggering automatic sync...");
    runOfflineSync();
  });

  window.addEventListener("billease:trigger-sync", () => {
    runOfflineSync();
  });

  // Initial check on startup if online
  if (navigator.onLine) {
    setTimeout(() => {
      runOfflineSync();
    }, 2000);
  }
}
