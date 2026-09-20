/**
 * High-Performance In-Memory Data Cache & In-Flight Request Deduplicator
 * 
 * 1. Eliminates redundant concurrent Supabase queries (request collapsing/deduplication).
 * 2. Caches fast read operations in memory with micro-TTL (8s default) for instant 0ms tab switching.
 * 3. Supports instant invalidation on mutations (create, update, delete).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

export const DataCache = {
  /**
   * Executes fetcher with automatic in-flight promise deduplication and micro-caching.
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 8000
  ): Promise<T> {
    const now = Date.now();

    // 1. Check if valid unexpired cached data exists
    const cached = cacheStore.get(key);
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data as T;
    }

    // 2. Check if identical request is already in-flight (deduplication)
    const existingPromise = inFlightPromises.get(key);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // 3. Initiate request and register in-flight promise
    const promise = (async () => {
      try {
        const result = await fetcher();
        if (result !== null && result !== undefined) {
          cacheStore.set(key, {
            data: result,
            timestamp: Date.now(),
            ttlMs,
          });
        }
        return result;
      } finally {
        inFlightPromises.delete(key);
      }
    })();

    inFlightPromises.set(key, promise);
    return promise;
  },

  /**
   * Invalidate specific key or all keys matching a prefix/tag.
   * e.g., invalidate("invoices") clears "invoices:tenant-1", "invoices:summary", etc.
   */
  invalidate(keyOrPrefix: string): void {
    if (cacheStore.has(keyOrPrefix)) {
      cacheStore.delete(keyOrPrefix);
    }
    inFlightPromises.delete(keyOrPrefix);

    for (const key of Array.from(cacheStore.keys())) {
      if (key.startsWith(keyOrPrefix)) {
        cacheStore.delete(key);
      }
    }
    for (const key of Array.from(inFlightPromises.keys())) {
      if (key.startsWith(keyOrPrefix)) {
        inFlightPromises.delete(key);
      }
    }
  },

  /**
   * Clear entire memory cache (used upon tenant switch or logout)
   */
  clearAll(): void {
    cacheStore.clear();
    inFlightPromises.clear();
  },
};
