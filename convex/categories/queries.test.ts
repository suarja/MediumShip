/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { syncContentInsert } from "./aggregate";

function makeTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "contentCategoryCounts");
  return t;
}

describe("listPublishedCategories", () => {
  it("returns configured categories with icons and counts", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("categories", {
        tenantSlug: "demo-media",
        label: "Analyses",
        slug: "analyses",
        iconKey: "analyses",
        sortOrder: 0,
        updatedAt: Date.now(),
      });
      const id = await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "care-economy",
        title: "Care economy",
        summary: "Published analyses row",
        category: "Analyses",
        tags: ["care"],
        isPremium: false,
      });
      const doc = await ctx.db.get(id);
      if (doc) await syncContentInsert(ctx, doc);
    });

    const result = await t.query(api.categories.queries.listPublishedCategories, {
      tenantSlug: "demo-media",
    });

    expect(result).toEqual([
      {
        category: "Analyses",
        count: 1,
        icon: "✎",
        iconKey: "analyses",
      },
    ]);
  });

  it("falls back to derived categories when none are configured", async () => {
    const t = makeTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "video",
        status: "published",
        slug: "debate-video",
        title: "Debate video",
        summary: "Video row",
        category: "Debat",
        tags: ["video"],
        isPremium: false,
      });
    });

    const result = await t.query(api.categories.queries.listPublishedCategories, {
      tenantSlug: "demo-media",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      category: "Debat",
      count: 1,
      icon: "▶",
    });
  });
});
