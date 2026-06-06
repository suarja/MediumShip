import { v } from "convex/values";

import { query } from "../_generated/server";

export const listPublishedFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();
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

export const listPublishedByCategory = query({
  args: { tenantSlug: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published")
          .eq("category", args.category),
      )
      .take(50);
  },
});

export const listPublishedCategories = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const contents = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();

    const counts = new Map<string, number>();
    for (const c of contents) {
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  },
});
