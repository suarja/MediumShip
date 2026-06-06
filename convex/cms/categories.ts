import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import {
  assertCategoryIconKey,
  slugifyCategoryLabel,
} from "../categories/model";
import { requireCmsAdmin } from "./authz";

async function ensureUniqueCategorySlug(
  ctx: MutationCtx,
  tenantSlug: string,
  slug: string,
  existingId?: string,
) {
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_tenantSlug_and_slug", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("slug", slug),
    )
    .unique();

  if (existing && existing._id !== existingId) {
    throw new Error("Slug already exists for this tenant");
  }
}

async function countContentsUsingCategory(
  ctx: MutationCtx,
  tenantSlug: string,
  label: string,
) {
  const contents = await ctx.db
    .query("contents")
    .withIndex("by_tenant_and_status", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "published"),
    )
    .collect();

  return contents.filter((content) => content.category === label).length;
}

export const listCmsCategories = query({
  args: { tenantSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const tenantSlug = args.tenantSlug ?? defaultTenant.slug;
    const rows = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
      .collect();

    return rows.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
    );
  },
});

export const getCmsCategory = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const createCategory = mutation({
  args: {
    label: v.string(),
    slug: v.string(),
    iconKey: v.string(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const label = args.label.trim();
    if (!label) {
      throw new Error("Label is required");
    }

    assertCategoryIconKey(args.iconKey);

    const slug = args.slug.trim() || slugifyCategoryLabel(label);
    if (!slug) {
      throw new Error("Slug is required");
    }

    await ensureUniqueCategorySlug(ctx, defaultTenant.slug, slug);

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", defaultTenant.slug))
      .collect();

    const sortOrder =
      args.sortOrder ?? (existing.length > 0 ? Math.max(...existing.map((row) => row.sortOrder)) + 1 : 0);

    return await ctx.db.insert("categories", {
      tenantSlug: defaultTenant.slug,
      label,
      slug,
      iconKey: args.iconKey,
      sortOrder,
      updatedAt: Date.now(),
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    label: v.string(),
    slug: v.string(),
    iconKey: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Category not found");
    }

    const label = args.label.trim();
    const slug = args.slug.trim();
    if (!label || !slug) {
      throw new Error("Label and slug are required");
    }

    assertCategoryIconKey(args.iconKey);
    await ensureUniqueCategorySlug(ctx, existing.tenantSlug, slug, existing._id);

    await ctx.db.patch(existing._id, {
      label,
      slug,
      iconKey: args.iconKey,
      sortOrder: args.sortOrder,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Category not found");
    }

    const usageCount = await countContentsUsingCategory(
      ctx,
      existing.tenantSlug,
      existing.label,
    );
    if (usageCount > 0) {
      throw new Error("Category is still used by published content");
    }

    await ctx.db.delete(existing._id);
    return args.id;
  },
});
