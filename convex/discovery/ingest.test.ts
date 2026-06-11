/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

function makeTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "contentCategoryCounts");
  return t;
}
import { aggregateCategoryAffinities } from "./fetchDemand";
import { SERENDIPITY_PER_RUN } from "./ingest";
import { rssProvider } from "./providers/rss";
import { wikipediaProvider, WIKIPEDIA_PAGES_PER_CATEGORY } from "./providers/wikipedia";
import { youtubeProvider } from "./providers/youtube";

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
  it("aggregates tenant preferences and returns taxonomy seed categories", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Culture",
        slug: "culture",
        iconKey: "culture",
        sortOrder: 1,
        updatedAt: 1,
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Economy",
        slug: "economy",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: 1,
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

    expect(inputs.seedCategories).toEqual(["Economy", "Culture"]);
    expect(inputs.aggregatedAffinities).toEqual([
      { targetId: "science", score: 55 },
    ]);
  });

  it("includes picked interest categories in aggregated affinities", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
      });
      await ctx.db.insert("categoryInterests", {
        tokenIdentifier: "member-a",
        tenantSlug: TENANT,
        categoryKey: "philosophie",
        updatedAt: 1,
      });
      await ctx.db.insert("categoryInterests", {
        tokenIdentifier: "member-b",
        tenantSlug: TENANT,
        categoryKey: "philosophie",
        updatedAt: 2,
      });
      await ctx.db.insert("categoryInterests", {
        tokenIdentifier: "member-b",
        tenantSlug: TENANT,
        categoryKey: "science",
        updatedAt: 3,
      });
    });

    const inputs = await t.query(internal.discovery.ingest.getTenantIngestionInputs, {
      tenantSlug: TENANT,
    });

    expect(inputs.aggregatedAffinities).toEqual([
      { targetId: "philosophie", score: 300 },
      { targetId: "science", score: 150 },
    ]);
    expect(inputs.seedCategories).toEqual([]);
  });

  it("cold-starts from taxonomy seeds when there are no affinities or interests", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Science",
        slug: "science",
        iconKey: "science",
        sortOrder: 0,
        updatedAt: 1,
      });
    });

    const inputs = await t.query(internal.discovery.ingest.getTenantIngestionInputs, {
      tenantSlug: TENANT,
    });

    expect(inputs.aggregatedAffinities).toEqual([]);
    expect(inputs.seedCategories).toEqual(["Science"]);
  });

  it("returns only aggregatedAffinities and seedCategories (no provider locale)", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: { locale: "fr" },
        },
      });
    });

    const inputs = await t.query(internal.discovery.ingest.getTenantIngestionInputs, {
      tenantSlug: TENANT,
    });

    expect(Object.keys(inputs).sort()).toEqual([
      "aggregatedAffinities",
      "seedCategories",
    ]);
    expect(inputs).not.toHaveProperty("wikipediaLocale");
  });
});

describe("provider-agnostic orchestration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("runRefillIngestion calls provider.ingest without wikipediaLocale", async () => {
    const t = makeTest();
    const ingestSpy = vi
      .spyOn(wikipediaProvider, "ingest")
      .mockResolvedValue({ upserted: 0 });

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: { locale: "fr" },
        },
      });
    });

    await t.action(internal.discovery.ingest.runRefillIngestion, {
      tenantSlug: TENANT,
      category: "science",
    });

    expect(ingestSpy).toHaveBeenCalledOnce();
    const [, ingestArgs] = ingestSpy.mock.calls[0]!;
    expect(ingestArgs).toEqual({
      tenantSlug: TENANT,
      demand: {
        categories: ["science"],
        coldStart: undefined,
      },
    });
    expect(ingestArgs).not.toHaveProperty("wikipediaLocale");
  });
});

describe("scheduled ingestion depth", () => {
  it("requests a larger Wikipedia batch per category", () => {
    expect(WIKIPEDIA_PAGES_PER_CATEGORY).toBeGreaterThanOrEqual(10);
  });
});

describe("runDiscoveryIngestion multi-provider seam", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("drives wikipedia, rss, and youtube with the same demand; rss/youtube no-op when unconfigured paths apply", async () => {
    const t = makeTest();
    const wikipediaSpy = vi
      .spyOn(wikipediaProvider, "ingest")
      .mockResolvedValue({ upserted: 1 });
    const rssSpy = vi.spyOn(rssProvider, "ingest").mockResolvedValue({ upserted: 0 });
    const youtubeSpy = vi
      .spyOn(youtubeProvider, "ingest")
      .mockResolvedValue({ upserted: 0 });

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo Media",
        enabledModules: ["discover"],
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Science",
        slug: "science",
        iconKey: "science",
        sortOrder: 0,
        updatedAt: 1,
      });
    });

    const result = await t.action(internal.discovery.ingest.runDiscoveryIngestion, {});

    expect(result.tenantsProcessed).toBe(1);
    expect(result.totalUpserted).toBe(1);

    expect(wikipediaSpy).toHaveBeenCalledOnce();
    expect(rssSpy).toHaveBeenCalledOnce();
    expect(youtubeSpy).toHaveBeenCalledOnce();

    const wikipediaArgs = wikipediaSpy.mock.calls[0]![1];
    const rssArgs = rssSpy.mock.calls[0]![1];
    const youtubeArgs = youtubeSpy.mock.calls[0]![1];
    expect(wikipediaArgs).toEqual(rssArgs);
    expect(youtubeArgs).toEqual(rssArgs);
    expect(wikipediaArgs.demand.categories).toContain("science");
    expect(wikipediaArgs).not.toHaveProperty("wikipediaLocale");
  });
});

describe("runDiscoveryIngestion serendipity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ingests a bounded random batch in addition to demand categories", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo Media",
        enabledModules: ["discover"],
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Science",
        slug: "science",
        iconKey: "science",
        sortOrder: 0,
        updatedAt: 1,
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
