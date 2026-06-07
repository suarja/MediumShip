import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

export const getTenantProviderConfig = internalQuery({
  args: {
    tenantSlug: v.string(),
    source: v.string(),
  },
  returns: v.union(v.record(v.string(), v.any()), v.null()),
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();

    return tenant?.providerConfigs?.[args.source] ?? null;
  },
});
