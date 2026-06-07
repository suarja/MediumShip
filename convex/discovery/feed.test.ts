/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import {
  buildOrderedDiscoveryFeed,
  encodeFeedCursor,
  paginateOrderedFeed,
  parseFeedCursor,
} from "./feed";

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

    expect(feed.items.length).toBeGreaterThan(0);
    expect(
      feed.items.every(
        (item) => item.reason === "editorial" || item.reason === "random",
      ),
    ).toBe(true);
    expect(feed.items.map((item) => item.title).sort()).toEqual(
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

    expect(feed.items.map((item) => item.title)).toEqual(["Free read"]);
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

    expect(feed.items.map((item) => item.title).sort()).toEqual([
      "Free read",
      "Premium read",
    ]);
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

    expect(feed.items).toHaveLength(10);
    expect(feed.nextCursor).toBe("10");
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

    expect(feed.items[0]?._id).toBe(politiqueId);
    expect(feed.items.some((item) => item.reason === "personalized")).toBe(true);
  });

  it("ranks picked category interests above unmatched content", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const scienceId = await insertPublishedContent(t, {
      title: "Science story",
      publishedAt: "2026-06-01T08:00:00.000Z",
      category: "Science",
    });
    await insertPublishedContent(t, {
      title: "Culture story",
      publishedAt: "2026-06-01T08:00:00.000Z",
      category: "Culture",
    });

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Science"],
    });

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 3,
    });

    expect(feed.items[0]?._id).toBe(scienceId);
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

    const likedItem = feed.items.find((item) => item._id === likedId);
    const neutralItem = feed.items.find((item) => item.title === "Neutral story");

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

    expect(feed.items.map((item) => item.title)).toEqual(["Visible story"]);
  });

  it("excludes content the member has already opened or finished", async () => {
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

    const page1 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 1,
      limit: 5,
    });

    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?._id).toBe(freshId);
    expect(page1.seekingFresh).toBe(true);
    expect(page1.nextCursor).toBeNull();
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
      personalized: feed.items.filter((item) => item.reason === "personalized")
        .length,
      archive: feed.items.filter((item) => item.reason === "archive").length,
      editorial: feed.items.filter((item) => item.reason === "editorial").length,
      random: feed.items.filter((item) => item.reason === "random").length,
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

    expect(feed.items.map((item) => item.title).sort()).toEqual(
      ["CMS read", "Wikipedia read"].sort(),
    );
  });
});

describe("getDiscoveryFeed pagination", () => {
  it("keeps stable order across pages for the same feedSeed", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    for (let index = 0; index < 15; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-06-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
      });
    }

    const page1 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 42,
      limit: 5,
    });
    const page2 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 42,
      limit: 5,
      cursor: page1.nextCursor,
    });

    const page1Ids = page1.items.map((item) => item._id);
    const page2Ids = page2.items.map((item) => item._id);

    expect(page1Ids).toHaveLength(5);
    expect(page2Ids).toHaveLength(5);
    expect(new Set([...page1Ids, ...page2Ids]).size).toBe(10);

    const full = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 42,
      limit: 15,
    });
    expect([...page1Ids, ...page2Ids]).toEqual(
      full.items.slice(0, 10).map((item) => item._id),
    );
  });

  it("reshuffles order when feedSeed changes", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    for (let index = 0; index < 12; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-06-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
      });
    }

    const seedA = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 1,
      limit: 12,
    });
    const seedB = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 2,
      limit: 12,
    });

    expect(seedA.items.map((item) => item._id)).not.toEqual(
      seedB.items.map((item) => item._id),
    );
  });

  it("sets seekingFresh when unseen items are fully paginated", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    for (let index = 0; index < 6; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-06-0${index + 1}T08:00:00.000Z`,
      });
    }

    const page1 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 7,
      limit: 4,
    });
    expect(page1.seekingFresh).toBe(false);

    const page2 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 7,
      limit: 4,
      cursor: page1.nextCursor,
    });
    expect(page2.seekingFresh).toBe(true);
    expect(page2.nextCursor).toBeNull();
    expect(page2.items.length).toBeGreaterThan(0);
  });

  it("does not wrap or repeat when the full corpus is consumed", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    for (let index = 0; index < 4; index += 1) {
      await insertPublishedContent(t, {
        title: `Story ${index}`,
        publishedAt: `2026-06-0${index + 1}T08:00:00.000Z`,
      });
    }

    const page1 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 99,
      limit: 4,
    });

    expect(page1.items).toHaveLength(4);
    expect(page1.nextCursor).toBeNull();
    expect(page1.seekingFresh).toBe(true);
  });

  it("returns empty with null cursor when the corpus is truly empty", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const feed = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
    });

    expect(feed.items).toEqual([]);
    expect(feed.nextCursor).toBeNull();
    expect(feed.seekingFresh).toBe(false);
  });

  it("excludes already-seen content instead of recycling archive repeats", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t, ["articles", "discover"]);
    const asMember = t.withIdentity(MEMBER);

    const seenId = await insertPublishedContent(t, {
      title: "Seen story",
      publishedAt: "2026-06-05T08:00:00.000Z",
    });
    await insertPublishedContent(t, {
      title: "Fresh story",
      publishedAt: "2026-06-04T08:00:00.000Z",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("contentInteractions", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        tenantSlug: TENANT,
        contentId: seenId,
        type: "finish",
        createdAt: 1,
      });
    });

    const page1 = await asMember.query(api.discovery.feed.getDiscoveryFeed, {
      tenantSlug: TENANT,
      tokenIdentifier: MEMBER.tokenIdentifier,
      feedSeed: 3,
      limit: 5,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.title).toBe("Fresh story");
    expect(page1.seekingFresh).toBe(true);
    expect(page1.nextCursor).toBeNull();
  });
});

describe("parseFeedCursor / encodeFeedCursor", () => {
  it("round-trips offset cursors and ignores legacy wrap suffixes", () => {
    expect(parseFeedCursor(null)).toBe(0);
    expect(parseFeedCursor("10")).toBe(10);
    expect(parseFeedCursor("3@2")).toBe(3);
    expect(encodeFeedCursor(10)).toBe("10");
  });
});

describe("paginateOrderedFeed", () => {
  it("returns no overlap between consecutive pages", () => {
    const ordered = Array.from({ length: 8 }, (_, index) => ({
      content: { _id: `id-${index}` } as never,
      reason: "editorial" as const,
    }));

    const page1 = paginateOrderedFeed({
      ordered,
      cursor: null,
      limit: 3,
    });
    const page2 = paginateOrderedFeed({
      ordered,
      cursor: page1.nextCursor,
      limit: 3,
    });

    const ids1 = page1.items.map((item) => item.content._id);
    const ids2 = page2.items.map((item) => item.content._id);
    expect(ids1).toEqual(["id-0", "id-1", "id-2"]);
    expect(ids2).toEqual(["id-3", "id-4", "id-5"]);
    expect(new Set([...ids1, ...ids2]).size).toBe(6);
  });

  it("marks seekingFresh when the ordered feed is exhausted", () => {
    const ordered = Array.from({ length: 2 }, (_, index) => ({
      content: { _id: `id-${index}` } as never,
      reason: "editorial" as const,
    }));

    const page1 = paginateOrderedFeed({ ordered, cursor: null, limit: 2 });
    expect(page1.seekingFresh).toBe(true);
    expect(page1.nextCursor).toBeNull();
  });
});

describe("buildOrderedDiscoveryFeed", () => {
  it("only includes unseen content and omits archive recycling", () => {
    const contents = [
      {
        _id: "fresh" as Id<"contents">,
        title: "Fresh",
        category: "A",
        tags: [],
        kind: "article" as const,
        publishedAt: "2026-06-06T08:00:00.000Z",
      },
      {
        _id: "seen" as Id<"contents">,
        title: "Seen",
        category: "B",
        tags: [],
        kind: "article" as const,
        publishedAt: "2026-06-05T08:00:00.000Z",
      },
    ] as never[];

    const { ordered } = buildOrderedDiscoveryFeed({
      visible: contents,
      tokenIdentifier: "token",
      feedSeed: 1,
      hiddenIds: new Set(),
      seenIds: new Set(["seen" as Id<"contents">]),
      affinities: [],
    });

    expect(ordered).toHaveLength(1);
    expect(ordered[0]?.content._id).toBe("fresh");
  });
});
