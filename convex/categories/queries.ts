import { v } from "convex/values";

import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { getCategoryPresentation } from "../../src/features/categories/category-presentation";
import { resolveCategoryIconGlyph } from "./model";
import { buildSearchResults, type TreeNode } from "./tree";

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

// ─── Tenant tree queries (ADR 0007 / Slice J) ─────────────────────────────────

/** Helper — load all categories for a tenant (bounded). */
async function loadTenantCategories(ctx: QueryCtx, tenantSlug: string) {
  return ctx.db
    .query("categories")
    .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
    .collect();
}

/**
 * Return root-level tenant categories (depth 0 or no parentId), sorted by
 * sortOrder then label. Only includes `isSelectable !== false` nodes
 * (selectable by members in the interest picker).
 */
export const listTenantCategoryRoots = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const all = await loadTenantCategories(ctx, args.tenantSlug);
    const selectable = all.filter((c) => c.isSelectable ?? true);
    const ids = new Set(selectable.map((c) => c._id));

    return selectable
      .filter((c) => !c.parentId || !ids.has(c.parentId))
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
      );
  },
});

/**
 * Flat tenant category rows for the mobile interest picker (tree built client-side).
 */
export const listTenantCategoryTree = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const all = await loadTenantCategories(ctx, args.tenantSlug);

    return all
      .filter((c) => c.isSelectable ?? true)
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
      )
      .map((category) => ({
        _id: category._id,
        label: category.label,
        iconKey: category.iconKey,
        parentId: category.parentId,
        depth: category.depth ?? 0,
      }));
  },
});

/**
 * Return direct children of a tenant category node, sorted by sortOrder then
 * label. Only returns `isSelectable !== false` nodes.
 */
export const listTenantCategoryChildren = query({
  args: {
    tenantSlug: v.string(),
    parentId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug_and_parentId", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("parentId", args.parentId),
      )
      .collect();
    return children
      .filter((c) => c.isSelectable ?? true)
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
      );
  },
});

/**
 * Search tenant categories by label (accent-insensitive).
 * Returns each matching node plus its subtree, capped at `maxDepth` levels.
 * Only `isSelectable !== false` nodes are included.
 */
export const searchTenantCategories = query({
  args: {
    tenantSlug: v.string(),
    query: v.string(),
    maxDepth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cap = args.maxDepth ?? 3;
    const all = await loadTenantCategories(ctx, args.tenantSlug);
    const selectable = all.filter((c) => c.isSelectable ?? true);

    const treeNodes: TreeNode[] = selectable.map((c) => ({
      id: c._id as string,
      parentId: c.parentId ? (c.parentId as string) : null,
      depth: c.depth ?? 0,
      label: c.label,
    }));

    const resultIds = new Set(
      buildSearchResults(treeNodes, args.query, cap).map((n) => n.id),
    );

    const nodeById = new Map(selectable.map((c) => [c._id as string, c]));
    return [...resultIds].map((id) => nodeById.get(id)).filter(Boolean);
  },
});
