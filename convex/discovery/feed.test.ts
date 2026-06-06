import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";
const MEMBER = { subject: "member_1", tokenIdentifier: "token_member" };

async function seedTenant(
  t: ReturnType<typeof convexTest>,
  enabledModules: string[],
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("tenants", {
      slug: TENANT,
      name: "Demo Media",
      enabledModules,
    });
  });
}

async function insertPublishedContent(
  t: ReturnType<typeof convexTest>,
  args: {
    title: string;
    publishedAt: string;
    isPremium?: boolean;
    category?: string;
  },
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind: "article",
      status: "published",
      slug: args.title.toLowerCase().replace(/\s+/g, "-"),
      title: args.title,
      summary: "Summary",
      category: args.category ?? "Analyse",
      tags: [],
      isPremium: args.isPremium ?? false,
      publishedAt: args.publishedAt,
    }),
  );
}

describe("getDiscoveryFeed guest path", () => {
  it("returns published contents mixed with reasons for guests", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "episodes", "videos", "premium", "discover"]);

    await insertPublishedContent(t, {
      title: "Fresh story",
      publishedAt: "2026-06-06T12:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Older story",
      publishedAt: "2026-06-01T08:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Archive story",
      publishedAt: "2026-05-01T08:00:00.000Z",
    });

    const feed = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
    });

    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((item) => item.reason === "editorial" || item.reason === "random")).toBe(
      true,
    );
    expect(feed.map((item) => item.title).sort()).toEqual(
      ["Archive story", "Fresh story", "Older story"].sort(),
    );
  });

  it("excludes premium content when the premium module is off", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);

    await insertPublishedContent(t, {
      title: "Free read",
      publishedAt: "2026-06-06T12:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Premium read",
      publishedAt: "2026-06-06T11:00:00.000Z",
      isPremium: true,
    });

    const feed = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
    });

    expect(feed.map((item) => item.title)).toEqual(["Free read"]);
  });

  it("includes premium content when the premium module is on", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "premium", "discover"]);

    await insertPublishedContent(t, {
      title: "Free read",
      publishedAt: "2026-06-06T12:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Premium read",
      publishedAt: "2026-06-06T11:00:00.000Z",
      isPremium: true,
    });

    const feed = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
    });

    expect(feed.map((item) => item.title).sort()).toEqual(["Free read", "Premium read"]);
  });

  it("returns at most the requested limit", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);

    for (let index = 0; index < 25; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-06-${String(index + 1).padStart(2, "0")}T08:00:00.000Z`,
      });
    }

    const feed = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      limit: 10,
    });

    expect(feed).toHaveLength(10);
  });
});

describe("getDiscoveryFeed authenticated path", () => {
  it("ranks category-matching content above unmatched content", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const politiqueId = await insertPublishedContent(t, {
      title: "Politique story",
      publishedAt: "2026-06-01T08:00:00.000Z",
      category: "Politique",
    });
    await insertPublishedContent(t, {
      title: "Culture story",
      publishedAt: "2026-06-01T08:00:00.000Z",
      category: "Culture",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("userPreferences", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        targetType: "category",
        targetId: "politique",
        score: 200,
        updatedAt: 1,
      });
    });

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 3,
    });

    expect(feed[0]?._id).toBe(politiqueId);
    expect(feed.some((item) => item.reason === "personalized")).toBe(true);
  });

  it("marks feed items the member has liked with isLiked", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const likedId = await insertPublishedContent(t, {
      title: "Liked story",
      publishedAt: "2026-06-02T08:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Neutral story",
      publishedAt: "2026-06-01T08:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId: likedId,
        type: "like",
        createdAt: 1,
      });
    });

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
    });

    const likedItem = feed.find((item) => item._id === likedId);
    const neutralItem = feed.find((item) => item.title === "Neutral story");

    expect(likedItem?.isLiked).toBe(true);
    expect(neutralItem?.isLiked).toBe(false);
  });

  it("excludes content the member has hidden", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const hiddenId = await insertPublishedContent(t, {
      title: "Hidden story",
      publishedAt: "2026-06-01T08:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Visible story",
      publishedAt: "2026-06-02T08:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId: hiddenId,
        type: "hide",
        createdAt: 1,
      });
    });

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
    });

    expect(feed.map((item) => item.title)).toEqual(["Visible story"]);
  });

  it("sinks content the member has already opened or finished", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const seenId = await insertPublishedContent(t, {
      title: "Already opened",
      publishedAt: "2026-06-05T08:00:00.000Z",
    });
    const freshId = await insertPublishedContent(t, {
      title: "Still fresh",
      publishedAt: "2026-06-04T08:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId: seenId,
        type: "open",
        createdAt: 1,
      });
    });

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 1,
    });

    const seenIndex = feed.findIndex((item) => item._id === seenId);
    const freshIndex = feed.findIndex((item) => item._id === freshId);

    expect(seenIndex).toBeGreaterThan(freshIndex);
  });

  it("uses the full 60/20/10/10 mix for authenticated members", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    for (let index = 0; index < 40; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-05-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
      });
    }

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 11,
      limit: 40,
    });

    const counts = {
      personalized: feed.filter((item) => item.reason === "personalized").length,
      archive: feed.filter((item) => item.reason === "archive").length,
      editorial: feed.filter((item) => item.reason === "editorial").length,
      random: feed.filter((item) => item.reason === "random").length,
    };

    expect(counts.personalized).toBeGreaterThanOrEqual(22);
    expect(counts.personalized).toBeLessThanOrEqual(26);
    expect(counts.archive).toBeGreaterThanOrEqual(6);
    expect(counts.archive).toBeLessThanOrEqual(10);
    expect(counts.editorial).toBeGreaterThanOrEqual(2);
    expect(counts.editorial).toBeLessThanOrEqual(6);
    expect(counts.random).toBeGreaterThanOrEqual(2);
    expect(counts.random).toBeLessThanOrEqual(6);
  });
});

describe("getDiscoveryFeed source isolation", () => {
  it("includes wikipedia content alongside editorial corpus", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "published",
        slug: "cms-read",
        title: "CMS read",
        summary: "Editorial",
        category: "Analyse",
        tags: [],
        isPremium: false,
        publishedAt: "2026-06-06T12:00:00.000Z",
        source: "cms",
      });
      await ctx.db.insert("contents", {
        tenantSlug: TENANT,
        kind: "article",
        status: "published",
        slug: "wiki-read",
        title: "Wikipedia read",
        summary: "Discovery",
        category: "science",
        tags: [],
        isPremium: false,
        publishedAt: "2026-06-06T11:00:00.000Z",
        source: "wikipedia",
        externalId: "999",
        canonicalUrl: "https://en.wikipedia.org/wiki/Example",
      });
    });

    const feed = await t.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
    });

    expect(feed.map((item) => item.title).sort()).toEqual(
      ["CMS read", "Wikipedia read"].sort(),
    );
  });
});
