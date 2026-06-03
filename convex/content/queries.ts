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
