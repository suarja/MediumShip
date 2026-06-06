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
      if (!isEditorialContent(c)) return false;
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

