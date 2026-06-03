import { v } from "convex/values";

import { query } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { getCmsViewer, requireCmsAdmin } from "./authz";

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getCmsViewer(ctx);

    return {
      isAuthenticated: viewer.identity !== null,
      isAdmin: viewer.isAdmin,
      canBootstrapAdmin: viewer.canBootstrapAdmin,
      adminExists: viewer.adminExists,
      email:
        viewer.user?.email ?? viewer.identity?.email ?? null,
      name:
        viewer.user?.name ?? viewer.identity?.name ?? null,
    };
  },
});

export const listContents = query({
  args: { tenantSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    return await ctx.db
      .query("contents")
      .withIndex("by_tenantSlug", (q) =>
        q.eq("tenantSlug", args.tenantSlug ?? defaultTenant.slug),
      )
      .order("desc")
      .take(100);
  },
});

export const getContent = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getTenantSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);

    return (
      (await ctx.db
        .query("tenants")
        .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
        .unique()) ?? {
        ...defaultTenant,
        _id: null,
        _creationTime: 0,
      }
    );
  },
});

export const getPreview = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const content = await ctx.db.get(args.id);
    if (!content) {
      return null;
    }

    const tenant =
      (await ctx.db
        .query("tenants")
        .withIndex("by_slug", (q) => q.eq("slug", content.tenantSlug))
        .unique()) ?? {
        ...defaultTenant,
        _id: null,
        _creationTime: 0,
      };

    return { content, tenant };
  },
});
