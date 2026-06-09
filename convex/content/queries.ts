import { v } from "convex/values";

import { query } from "../_generated/server";
import { isEditorialContent } from "./source";

export const listPublishedFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const published = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();

    return published.filter(isEditorialContent);
  },
});

export const getPublishedById = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content || content.status !== "published") {
      return null;
    }
    return content;
  },
});

export const searchPublished = query({
  args: { tenantSlug: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("contents")
      .withSearchIndex("search_title", (q) =>
        q
          .search("title", args.query)
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published"),
      )
      .take(40);

    const lower = args.query.toLowerCase();
    const results = candidates.filter((c) => {
      if (c.status !== "published") return false;
      // Search spans every source — editorial CMS content and ingested
      // discovery content (Wikipedia, YouTube, RSS) alike.
      return (
        c.title.toLowerCase().includes(lower) ||
        c.summary.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        c.tags.some((tag) => tag.toLowerCase().includes(lower))
      );
    });

    return { contents: results };
  },
});

/**
 * Real "trends" for the Explore surface: the most frequent tags across published
 * content (all sources). Bounded sample keeps it cheap on large discovery sets.
 */
export const getTrendingTopics = query({
  args: { tenantSlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const sample = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .take(1000);

    const counts = new Map<string, number>();
    for (const content of sample) {
      for (const tag of content.tags) {
        const key = tag.trim();
        if (key.length < 3) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const limit = args.limit ?? 6;
    const topics = [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return { topics };
  },
});

export const listPublishedByCategory = query({
  args: { tenantSlug: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published")
          .eq("category", args.category),
      )
      .take(50);

    return rows.filter(isEditorialContent);
  },
});

