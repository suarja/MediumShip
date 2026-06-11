/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import aggregateTest from "@convex-dev/aggregate/test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { contentCategoryCounts, syncContentUpdate, syncContentDelete } from "./aggregate";

const TENANT = "demo-media";

function makeTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "contentCategoryCounts");
  return t;
}

/** Helper: count published docs in a specific category via the aggregate. */
async function countPublishedCategory(
  t: ReturnType<typeof makeTest>,
  category: string,
): Promise<number> {
  return t.run(async (ctx) => {
    return contentCategoryCounts.count(ctx, {
      bounds: { prefix: [TENANT, "published", category] },
    });
  });
}

describe("contentCategoryCounts aggregate write-path coverage", () => {
  it("insert published via ingest → count +1", async () => {
    const t = makeTest();
    const before = await countPublishedCategory(t, "Analyses");

    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "published",
          slug: "agg-test-insert-1",
          title: "Test insert",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-insert-1",
          canonicalUrl: "https://example.com/agg-test-insert-1",
        },
      ],
    });

    const after = await countPublishedCategory(t, "Analyses");
    expect(after).toBe(before + 1);
  });

  it("insert draft via ingest → published count unchanged", async () => {
    const t = makeTest();
    const before = await countPublishedCategory(t, "Analyses");

    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "draft",
          slug: "agg-test-draft-1",
          title: "Draft insert",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-draft-1",
          canonicalUrl: "https://example.com/agg-test-draft-1",
        },
      ],
    });

    const after = await countPublishedCategory(t, "Analyses");
    expect(after).toBe(before);
  });

  it("status draft→published → count +1 (syncContentUpdate)", async () => {
    const t = makeTest();

    // Insert a draft via ingest (aggregate sees it as draft)
    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "draft",
          slug: "agg-test-publish-1",
          title: "Draft to publish",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-publish-1",
          canonicalUrl: "https://example.com/agg-test-publish-1",
        },
      ],
    });

    const before = await countPublishedCategory(t, "Analyses");

    await t.run(async (ctx) => {
      const doc = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", TENANT).eq("slug", "agg-test-publish-1"),
        )
        .unique();
      if (!doc) throw new Error("content not found");
      const oldDoc = doc;
      await ctx.db.replace(doc._id, { ...doc, status: "published", publishedAt: new Date().toISOString() });
      const newDoc = await ctx.db.get(doc._id);
      if (newDoc) await syncContentUpdate(ctx, oldDoc, newDoc);
    });

    const after = await countPublishedCategory(t, "Analyses");
    expect(after).toBe(before + 1);
  });

  it("status published→archived → count -1 (syncContentUpdate)", async () => {
    const t = makeTest();

    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "published",
          slug: "agg-test-archive-1",
          title: "To archive",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-archive-1",
          canonicalUrl: "https://example.com/agg-test-archive-1",
        },
      ],
    });

    const before = await countPublishedCategory(t, "Analyses");

    await t.run(async (ctx) => {
      const doc = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", TENANT).eq("slug", "agg-test-archive-1"),
        )
        .unique();
      if (!doc) throw new Error("content not found");
      const oldDoc = doc;
      await ctx.db.replace(doc._id, { ...doc, status: "archived" });
      const newDoc = await ctx.db.get(doc._id);
      if (newDoc) await syncContentUpdate(ctx, oldDoc, newDoc);
    });

    const after = await countPublishedCategory(t, "Analyses");
    expect(after).toBe(before - 1);
  });

  it("category change on published content → -1 old / +1 new (syncContentUpdate)", async () => {
    const t = makeTest();

    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "published",
          slug: "agg-test-cat-change-1",
          title: "Category changer",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-cat-change-1",
          canonicalUrl: "https://example.com/agg-test-cat-change-1",
        },
      ],
    });

    const beforeAnalyses = await countPublishedCategory(t, "Analyses");
    const beforeCulture = await countPublishedCategory(t, "Culture");

    await t.run(async (ctx) => {
      const doc = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", TENANT).eq("slug", "agg-test-cat-change-1"),
        )
        .unique();
      if (!doc) throw new Error("content not found");
      const oldDoc = doc;
      await ctx.db.replace(doc._id, { ...doc, category: "Culture" });
      const newDoc = await ctx.db.get(doc._id);
      if (newDoc) await syncContentUpdate(ctx, oldDoc, newDoc);
    });

    const afterAnalyses = await countPublishedCategory(t, "Analyses");
    const afterCulture = await countPublishedCategory(t, "Culture");
    expect(afterAnalyses).toBe(beforeAnalyses - 1);
    expect(afterCulture).toBe(beforeCulture + 1);
  });

  it("delete published content → count -1 (syncContentDelete)", async () => {
    const t = makeTest();

    await t.mutation(internal.discovery.ingest.upsertIngested, {
      items: [
        {
          tenantSlug: TENANT,
          kind: "article",
          status: "published",
          slug: "agg-test-delete-1",
          title: "To delete",
          summary: "Summary",
          category: "Analyses",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: "agg-test-delete-1",
          canonicalUrl: "https://example.com/agg-test-delete-1",
        },
      ],
    });

    const before = await countPublishedCategory(t, "Analyses");

    await t.run(async (ctx) => {
      const doc = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", TENANT).eq("slug", "agg-test-delete-1"),
        )
        .unique();
      if (!doc) throw new Error("content not found");
      await syncContentDelete(ctx, doc);
      await ctx.db.delete(doc._id);
    });

    const after = await countPublishedCategory(t, "Analyses");
    expect(after).toBe(before - 1);
  });
});
