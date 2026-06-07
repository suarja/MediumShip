/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { aggregateCategoryAffinities } from "./fetchDemand";
import { SERENDIPITY_PER_RUN } from "./ingest";
import { WIKIPEDIA_PAGES_PER_CATEGORY } from "./providers/wikipedia";

const TENANT = "demo-media";

describe("aggregateCategoryAffinities", () => {
  it("sums per-category scores across members", () => {
    const aggregated = aggregateCategoryAffinities([
      { targetType: "category", targetId: "Science", score: 40 },
      { targetType: "category", targetId: "science", score: 20 },
      { targetType: "category", targetId: "History", score: 15 },
      { targetType: "tag", targetId: "physics", score: 999 },
    ]);

    expect(aggregated).toEqual([
      { targetId: "science", score: 60 },
      { targetId: "history", score: 15 },
    ]);
  });
});

describe("getTenantIngestionInputs", () => {
  it("aggregates tenant preferences and returns seed categories", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        discoverySeedCategories: ["Culture", "Economy"],
      });
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: "member-a",
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "Science",
        score: 30,
        updatedAt: 1,
      });
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: "member-b",
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "science",
        score: 25,
        updatedAt: 2,
      });
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: "member-c",
        tenantSlug: "other-tenant",
        targetType: "category",
        targetId: "Politics",
        score: 100,
        updatedAt: 3,
      });
    });

    const inputs = await t.query(internal.discovery.ingest.getTenantIngestionInputs, {
      tenantSlug: TENANT,
    });

    expect(inputs.seedCategories).toEqual(["Culture", "Economy"]);
    expect(inputs.aggregatedAffinities).toEqual([
      { targetId: "science", score: 55 },
    ]);
  });
});

describe("scheduled ingestion depth", () => {
  it("requests a larger Wikipedia batch per category", () => {
    expect(WIKIPEDIA_PAGES_PER_CATEGORY).toBeGreaterThanOrEqual(10);
  });
});

describe("runDiscoveryIngestion serendipity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ingests a bounded random batch in addition to demand categories", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        discoverySeedCategories: ["science"],
      });
    });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url).searchParams;

      if (params.get("list") === "random") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: {
              random: [{ id: 901, title: "Serendipity article" }],
            },
          }),
        });
      }

      if (params.get("pageids") === "901") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: {
              pages: {
                "901": {
                  pageid: 901,
                  title: "Serendipity article",
                  extract: "A random topic.",
                  categories: [{ ns: 14, title: "Category:Astronomy" }],
                },
              },
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              "42": {
                pageid: 42,
                title: "Science topic",
                extract: "Seed category page.",
              },
            },
          },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result: { tenantsProcessed: number; totalUpserted: number } =
      await t.action(internal.discovery.ingest.runDiscoveryIngestion, {});

    expect(result.tenantsProcessed).toBe(1);
    expect(result.totalUpserted).toBe(2);

    const randomCalls = fetchMock.mock.calls.filter(
      (call) => new URL(call[0] as string).searchParams.get("list") === "random",
    );
    expect(randomCalls).toHaveLength(1);
    expect(
      new URL(randomCalls[0]![0] as string).searchParams.get("rnlimit"),
    ).toBe(String(SERENDIPITY_PER_RUN));

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("contents")
        .withIndex("by_tenant_and_status", (q) =>
          q.eq("tenantSlug", TENANT).eq("status", "published"),
        )
        .collect(),
    );

    expect(rows).toHaveLength(2);
    const serendipityRow = rows.find((row) => row.externalId === "901");
    expect(serendipityRow?.category).toBe("astronomy");
    expect(serendipityRow?.tags).toContain("astronomy");
    expect(serendipityRow?.category).not.toBe("serendipity");
  });
});
