import { describe, it, expect, beforeEach, vi } from "vitest";
import { DataCache } from "@/lib/data-cache";

describe("DataCache & Request Deduplicator Performance Engine", () => {
  beforeEach(() => {
    DataCache.clearAll();
  });

  it("collapses concurrent identical fetch calls into a single in-flight Promise", async () => {
    let callCount = 0;
    const slowFetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return [{ id: "item-1", amount: 1000 }];
    };

    // 5 concurrent identical requests
    const [res1, res2, res3, res4, res5] = await Promise.all([
      DataCache.fetch("invoices:tenant-1", slowFetcher),
      DataCache.fetch("invoices:tenant-1", slowFetcher),
      DataCache.fetch("invoices:tenant-1", slowFetcher),
      DataCache.fetch("invoices:tenant-1", slowFetcher),
      DataCache.fetch("invoices:tenant-1", slowFetcher),
    ]);

    expect(callCount).toBe(1);
    expect(res1).toEqual(res2);
    expect(res1).toEqual(res5);
  });

  it("serves cached results instantly (0ms) within TTL without re-fetching", async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { status: "ok" };
    };

    const first = await DataCache.fetch("payments:tenant-1", fetcher, 5000);
    expect(fetchCount).toBe(1);

    const second = await DataCache.fetch("payments:tenant-1", fetcher, 5000);
    expect(fetchCount).toBe(1);
    expect(second).toEqual(first);
  });

  it("invalidates keys by prefix immediately on mutation", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return `data-${callCount}`;
    };

    const val1 = await DataCache.fetch("invoices:tenant-1", fetcher);
    expect(val1).toBe("data-1");

    // Invalidate using prefix tag
    DataCache.invalidate("invoices");

    const val2 = await DataCache.fetch("invoices:tenant-1", fetcher);
    expect(val2).toBe("data-2");
    expect(callCount).toBe(2);
  });

  it("clears entire cache on clearAll", async () => {
    let calls = 0;
    const f = async () => ++calls;

    await DataCache.fetch("key1", f);
    await DataCache.fetch("key2", f);
    expect(calls).toBe(2);

    DataCache.clearAll();

    await DataCache.fetch("key1", f);
    expect(calls).toBe(3);
  });
});
