import { v } from "convex/values";

import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { getCategoryPresentation } from "../../src/features/categories/category-presentation";
import { resolveCategoryIconGlyph } from "./model";

async function publishedCategoryCounts(ctx: QueryCtx, tenantSlug: string) {
  const contents = await ctx.db
    .query("contents")
    .withIndex("by_tenant_and_status", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "published"),
    )
    .collect();

  const counts = new Map<string, number>();
  for (const content of contents) {
    counts.set(content.category, (counts.get(content.category) ?? 0) + 1);
  }

  return counts;
}

export const listPublishedCategories = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const counts = await publishedCategoryCounts(ctx, args.tenantSlug);
    const configured = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", args.tenantSlug))
      .collect();

    if (configured.length > 0) {
      return configured
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
        )
        .map((category) => ({
          category: category.label,
          count: counts.get(category.label) ?? 0,
          icon: resolveCategoryIconGlyph(category.iconKey),
          iconKey: category.iconKey,
        }));
    }

    return Array.from(counts.entries())
      .map(([category, count]) => {
        const presentation = getCategoryPresentation(category);
        return {
          category,
          count,
          icon: presentation.icon,
          iconKey: presentation.normalizedKey,
        };
      })
      .sort((left, right) => right.count - left.count);
  },
});

export const listCategoryOptions = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", args.tenantSlug))
      .collect();

    return rows
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
      )
      .map((category) => ({
        label: category.label,
        icon: resolveCategoryIconGlyph(category.iconKey),
        iconKey: category.iconKey,
      }));
  },
});
