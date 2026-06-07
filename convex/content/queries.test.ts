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

describe("editorial source isolation", () => {
  it("excludes wikipedia, rss, and youtube content from listPublishedFeed and category reads", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "cms-story",
        title: "CMS story",
        summary: "Editorial",
        category: "Analyses",
        tags: [],
        isPremium: false,
        source: "cms",
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "legacy-story",
        title: "Legacy story",
        summary: "No source field",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "wiki-story",
        title: "Wikipedia story",
        summary: "Discovery only",
        category: "science",
        tags: [],
        isPremium: false,
        source: "wikipedia",
        externalId: "123",
        canonicalUrl: "https://en.wikipedia.org/wiki/Example",
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "rss-story-abcd1234",
        title: "RSS story",
        summary: "External feed only",
        category: "Analyses",
        tags: [],
        isPremium: false,
        source: "rss",
        externalId: "rss-123",
        canonicalUrl: "https://example.com/rss-story",
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "video",
        status: "published",
        slug: "youtube-video-abc123",
        title: "YouTube video",
        summary: "Discovery only video",
        category: "science",
        tags: ["science"],
        isPremium: false,
        source: "youtube",
        externalId: "abc123XYZ9",
        canonicalUrl: "https://youtube.com/watch?v=abc123XYZ9",
        durationSeconds: 312,
        videoSource: {
          kind: "youtube",
          youtubeVideoId: "abc123XYZ9",
          youtubeUrl: "https://youtube.com/watch?v=abc123XYZ9",
        },
      });
    });

    const feed = await t.query(api.content.queries.listPublishedFeed, {
      tenantSlug: "demo-media",
    });
    const category = await t.query(api.content.queries.listPublishedByCategory, {
      tenantSlug: "demo-media",
      category: "Analyses",
    });
    const search = await t.query(api.content.queries.searchPublished, {
      tenantSlug: "demo-media",
      query: "story",
    });

    expect(feed.map((item) => item.title).sort()).toEqual(
      ["CMS story", "Legacy story"].sort(),
    );
    expect(category.map((item) => item.title).sort()).toEqual(
      ["CMS story", "Legacy story"].sort(),
    );
    expect(search.contents.map((item) => item.title).sort()).toEqual(
      ["CMS story", "Legacy story"].sort(),
    );
  });
});
