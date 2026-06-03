import { mutation } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

export const seedDemoContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    if (!existingTenant) {
      await ctx.db.insert("tenants", {
        slug: defaultTenant.slug,
        name: defaultTenant.name,
        themeConfig: defaultTenant.themeConfig,
        enabledModules: defaultTenant.enabledModules,
      });
    }
  },
});
