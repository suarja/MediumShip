import { query } from "../_generated/server";

export const getDefaultTenant = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-media"))
      .unique();
  },
});
