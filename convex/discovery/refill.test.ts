/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { isCategoryThrottled, REFILL_THROTTLE_MS } from "./refill";

const TENANT = "demo-media";

async function seedTenantForRefill(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("tenants", {
      slug: TENANT,
      name: "Demo Media",
      enabledModules: ["discover"],
      discoverySeedCategories: ["Science", "History"],
    });
  });
}

describe("isCategoryThrottled", () => {
  it("returns false when no prior request exists", () => {
    expect(isCategoryThrottled(null, 1_000, REFILL_THROTTLE_MS)).toBe(false);
  });

  it("returns true within the throttle window", () => {
    expect(
      isCategoryThrottled(
        { lastRequestedAt: 1_000 },
        1_000 + REFILL_THROTTLE_MS - 1,
        REFILL_THROTTLE_MS,
      ),
    ).toBe(true);
  });

  it("returns false after the throttle window elapses", () => {
    expect(
      isCategoryThrottled(
        { lastRequestedAt: 1_000 },
        1_000 + REFILL_THROTTLE_MS,
        REFILL_THROTTLE_MS,
      ),
    ).toBe(false);
  });
});

describe("requestDiscoveryRefill", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("schedules ingestion for FetchDemand categories on first call", async () => {
    const t = convexTest(schema, modules);
    await seedTenantForRefill(t);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "42": {
              pageid: 42,
              title: "Quantum mechanics",
              extract: "Physics theory.",
              fullurl: "https://en.wikipedia.org/wiki/Quantum_mechanics",
            },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });

    expect(result.scheduledCategories.length).toBeGreaterThan(0);
    expect(result.scheduledCategories).toContain("science");

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(0);
    });

    const throttleRows = await t.run(async (ctx) =>
      ctx.db
        .query("ingestionThrottle")
        .withIndex("by_tenant_and_category", (q) =>
          q.eq("tenantSlug", TENANT).eq("categoryKey", "science"),
        )
        .collect(),
    );
    expect(throttleRows).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("coalesces duplicate requests within the throttle window", async () => {
    const t = convexTest(schema, modules);
    await seedTenantForRefill(t);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "42": {
              pageid: 42,
              title: "Quantum mechanics",
              extract: "Physics theory.",
            },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });
    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(0);
    });
    fetchMock.mockClear();

    const second = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });
    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(0);
    });

    expect(first.scheduledCategories.length).toBeGreaterThan(0);
    expect(second.scheduledCategories).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a second request after the shortened throttle window elapses", async () => {
    const t = convexTest(schema, modules);
    await seedTenantForRefill(t);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "42": {
              pageid: 42,
              title: "Quantum mechanics",
              extract: "Physics theory.",
            },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });
    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(0);
    });
    fetchMock.mockClear();

    vi.advanceTimersByTime(REFILL_THROTTLE_MS - 1);
    const blocked = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });
    expect(blocked.scheduledCategories).toEqual([]);

    vi.advanceTimersByTime(1);
    const second = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });
    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(0);
    });

    expect(first.scheduledCategories.length).toBeGreaterThan(0);
    expect(second.scheduledCategories.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("accepts guest callers without authentication", async () => {
    const t = convexTest(schema, modules);
    await seedTenantForRefill(t);

    const result = await t.mutation(api.discovery.refill.requestDiscoveryRefill, {
      tenantSlug: TENANT,
    });

    expect(result.scheduledCategories.length).toBeGreaterThan(0);
  });
});
