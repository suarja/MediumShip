/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

describe("listPublishedByCategory", () => {
  it("returns only published docs for the requested tenant and exact category", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
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
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "episode",
        status: "draft",
        slug: "draft-analysis",
        title: "Draft analysis",
        summary: "Should stay hidden",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
      await ctx.db.insert("contents", {
        tenantSlug: "other-tenant",
        kind: "article",
        status: "published",
        slug: "other-tenant-analysis",
        title: "Other tenant",
        summary: "Wrong tenant",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
    });

    const result = await t.query(api.content.queries.listPublishedByCategory, {
      tenantSlug: "demo-media",
      category: "Analyses",
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Care economy");
  });
});
