/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { aggregateCategoryAffinities } from "./fetchDemand";
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
