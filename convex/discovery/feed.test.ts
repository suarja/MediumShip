import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";

async function seedTenant(
  t: ReturnType<typeof convexTest>,
  enabledModules: string[],
) {
  await t.run(async (ctx) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", TENANT))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { enabledModules });
      return;
    }

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
