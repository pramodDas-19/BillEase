// ============================================================================
// BILLEASE SAAS — INDEXEDDB OPTIMISTIC RETRY QUEUE
// Browser-native persistence for flaky connectivity (zero external dependencies).
// Strictly enforces single pending mutation per record (Constraint 4).
// ============================================================================

export type MutationEntityType = "invoice" | "quotation" | "client" | "payment";
export type MutationAction = "create" | "update";
export type MutationStatus = "pending" | "retrying" | "failed";

export interface PendingMutation {
  id: string;
  entityType: MutationEntityType;
  entityId: string;
  action: MutationAction;
  tenantId: string;
  payload: any;
  displayTitle: string;
  createdAt: string;
  updatedAt: string;
  status: MutationStatus;
  retryCount: number;
  errorMessage?: string | null;
}

export interface EnqueueMutationInput {
  entityType: MutationEntityType;
  entityId: string;
  action: MutationAction;
  tenantId: string;
  payload: any;
  displayTitle: string;
}

const DB_NAME = "billease_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "pending_mutations";

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and opens the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_entity", ["entityType", "entityId"], { unique: false });
        store.createIndex("by_created", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

function notifyQueueUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("billease:queue-updated"));
  }
}

/**
 * Enqueues a mutation into IndexedDB.
 * HARD CONSTRAINT: Only ONE pending mutation per record.
 * If an item for (entityType, entityId) already exists, it merges payloads and updates in-place.
 */
export async function enqueueMutation(input: EnqueueMutationInput): Promise<PendingMutation> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("by_entity");

    const query = index.getAll([input.entityType, input.entityId]);

    query.onsuccess = () => {
      const existingList: PendingMutation[] = query.result || [];
      const now = new Date().toISOString();

      if (existingList.length > 0) {
        // Overwrite existing queued mutation locally to prevent duplicate conflicting mutations
        const existing = existingList[0];
        const updatedMutation: PendingMutation = {
          ...existing,
          displayTitle: input.displayTitle || existing.displayTitle,
          payload: {
            ...existing.payload,
            ...input.payload,
          },
          updatedAt: now,
          status: "pending",
          // Preserve original "create" action if the record was originally queued for creation
          action: existing.action === "create" ? "create" : input.action,
        };

        const putReq = store.put(updatedMutation);
        putReq.onsuccess = () => {
          notifyQueueUpdated();
          resolve(updatedMutation);
        };
        putReq.onerror = () => reject(putReq.error);
      } else {
        // Create new queued mutation
        const newMutation: PendingMutation = {
          id: `mutation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          tenantId: input.tenantId,
          payload: input.payload,
          displayTitle: input.displayTitle,
          createdAt: now,
          updatedAt: now,
          status: "pending",
          retryCount: 0,
          errorMessage: null,
        };

        const addReq = store.add(newMutation);
        addReq.onsuccess = () => {
          notifyQueueUpdated();
          resolve(newMutation);
        };
        addReq.onerror = () => reject(addReq.error);
      }
    };

    query.onerror = () => reject(query.error);
  });
}

/**
 * Retrieves all pending mutations ordered chronologically (FIFO)
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("by_created");
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Gets count of pending mutations in the queue
 */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => resolve(countReq.result || 0);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Removes a completed or discarded mutation from the queue
 */
export async function removeMutation(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        notifyQueueUpdated();
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
}

/**
 * Updates status and error of a queued mutation (e.g. marking it as 'failed' after server error)
 */
export async function updateMutationStatus(
  id: string,
  status: MutationStatus,
  errorMessage?: string | null
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: PendingMutation = getReq.result;
        if (!item) return resolve(false);

        item.status = status;
        item.updatedAt = new Date().toISOString();
        if (errorMessage !== undefined) {
          item.errorMessage = errorMessage;
        }
        if (status === "retrying") {
          item.retryCount = (item.retryCount || 0) + 1;
        }

        const putReq = store.put(item);
        putReq.onsuccess = () => {
          notifyQueueUpdated();
          resolve(true);
        };
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return false;
  }
}

/**
 * Clears all mutations from the queue
 */
export async function clearQueue(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        notifyQueueUpdated();
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
}
