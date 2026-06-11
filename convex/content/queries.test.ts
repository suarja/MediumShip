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
    // Search spans every source: editorial + ingested discovery content.
    expect(search.contents.map((item) => item.title).sort()).toEqual(
      ["CMS story", "Legacy story", "RSS story", "Wikipedia story"].sort(),
    );
  });

  it("reads editorial directly by source index, not by scanning the full corpus", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // A large discovery corpus (the thing that made the old full-scan ~14MB).
      for (let i = 0; i < 60; i += 1) {
        await ctx.db.insert("contents", {
          tenantSlug: "demo-media",
          kind: "article",
          status: "published",
          slug: `wiki-${i}`,
          title: `Wiki ${i}`,
          summary: "Discovery only",
          category: "science",
          tags: [],
          isPremium: false,
          source: "wikipedia",
          externalId: `w-${i}`,
          canonicalUrl: `https://en.wikipedia.org/wiki/Example_${i}`,
        });
      }
      // Two editorial rows (cms + legacy/no-source).
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "editorial-cms",
        title: "Editorial CMS",
        summary: "",
        category: "Analyses",
        tags: [],
        isPremium: false,
        source: "cms",
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "editorial-legacy",
        title: "Editorial legacy",
        summary: "",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
    });

    const feed = await t.query(api.content.queries.listPublishedFeed, {
      tenantSlug: "demo-media",
    });

    // Only the 2 editorial rows surface, regardless of the 60-row discovery corpus.
    expect(feed.map((item) => item.title).sort()).toEqual(
      ["Editorial CMS", "Editorial legacy"].sort(),
    );
  });

  it("ranks the most frequent tags as trending topics", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const seed = (slug: string, tags: string[]) =>
        ctx.db.insert("contents", {
          tenantSlug: "demo-media",
          kind: "article",
          status: "published",
          slug,
          title: slug,
          summary: "",
          category: "science",
          tags,
          isPremium: false,
          source: "wikipedia",
          externalId: slug,
          canonicalUrl: `https://example.com/${slug}`,
        });

      await seed("a", ["intelligence-artificielle", "histoire"]);
      await seed("b", ["intelligence-artificielle", "science"]);
      await seed("c", ["intelligence-artificielle"]);
      await seed("d", ["histoire"]);
    });

    const { topics } = await t.query(api.content.queries.getTrendingTopics, {
      tenantSlug: "demo-media",
      limit: 3,
    });

    expect(topics[0]).toEqual({ tag: "intelligence-artificielle", count: 3 });
    expect(topics.map((entry) => entry.tag)).toContain("histoire");
    expect(topics.length).toBeLessThanOrEqual(3);
  });

  it("surfaces tag/category matches even when the title has no hit (trend tap)", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "video",
        status: "published",
        slug: "robot-vid",
        title: "Une vidéo passionnante", // title contains neither "robotique" nor "tech"
        summary: "",
        category: "tech",
        tags: ["robotique", "ia"],
        isPremium: false,
        source: "youtube",
        externalId: "robot-vid",
        canonicalUrl: "https://youtube.com/watch?v=robot-vid",
      });
    });

    // Tapping a trending tag whose word never appears in any title must still resolve.
    const byTag = await t.query(api.content.queries.searchPublished, {
      tenantSlug: "demo-media",
      query: "robotique",
    });
    expect(byTag.contents.map((c) => c.title)).toEqual(["Une vidéo passionnante"]);

    const byCategory = await t.query(api.content.queries.searchPublished, {
      tenantSlug: "demo-media",
      query: "tech",
    });
    expect(byCategory.contents).toHaveLength(1);
  });
});
