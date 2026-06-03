import { v } from "convex/values";

import { query } from "../_generated/server";

export const listFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant", (q) => q.eq("tenantSlug", args.tenantSlug))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
