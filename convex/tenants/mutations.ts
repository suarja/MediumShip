import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { isThemePaletteName } from "../../src/features/theme/palette-catalog";

export const setDefaultTenantPalette = mutation({
  args: {
    paletteName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isThemePaletteName(args.paletteName)) {
      throw new Error(`Unknown palette: ${args.paletteName}`);
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    if (!tenant) {
      await ctx.db.insert("tenants", {
        slug: defaultTenant.slug,
        name: defaultTenant.name,
        enabledModules: defaultTenant.enabledModules,
        themeConfig: { paletteName: args.paletteName },
        feedSections: defaultTenant.feedSections,
      });
      return;
    }

    await ctx.db.patch(tenant._id, {
      themeConfig: { paletteName: args.paletteName },
    });
  },
});
