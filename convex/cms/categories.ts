import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import {
  assertCategoryIconKey,
  slugifyCategoryLabel,
} from "../categories/model";
import { requireCmsAdmin } from "./authz";
import type { Id } from "../_generated/dataModel";
import { buildSubtree, type TreeNode } from "../categories/tree";
import { resolveCatalogDisplayLabel } from "../categories/catalogLocale";

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

/**
 * Copy one or more nodes from the global `categoryCatalog` into the tenant's
 * `categories` table, preserving the tree shape (parentId links are remapped
 * to the newly created tenant category IDs).
 *
 * - Existing tenant category slugs are skipped (idempotent).
 * - `catalogNodeId` on each copied row traces the origin back to the catalog.
 * - `includeDescendants` (default false) copies the full subtree.
 */
export const addCategoryFromCatalog = mutation({
  args: {
    tenantSlug: v.optional(v.string()),
    catalogNodeId: v.id("categoryCatalog"),
    includeDescendants: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const tenantSlug = args.tenantSlug ?? defaultTenant.slug;
    const includeDescendants = args.includeDescendants ?? false;

    // Load the source node(s) from the catalog
    const catalogRoot = await ctx.db.get(args.catalogNodeId);
    if (!catalogRoot) throw new Error("Catalog node not found");
    if (catalogRoot.depth === 0) {
      throw new Error(
        "Les racines IPTC (niveau 1) sont trop larges — choisis un sous-thème",
      );
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
      .unique();
    const catalogLocale = tenant?.catalogLocale ?? "en";

    let catalogNodesToCopy: typeof catalogRoot[] = [catalogRoot];

    if (includeDescendants) {
      const allCatalog = await ctx.db.query("categoryCatalog").take(5000);
      const treeNodes: TreeNode[] = allCatalog.map((n) => ({
        id: n._id as string,
        parentId: n.parentId ? (n.parentId as string) : null,
        depth: n.depth,
        label: n.label,
      }));
      const subtreeIds = new Set(
        buildSubtree(treeNodes, args.catalogNodeId as string, 99).map(
          (n) => n.id,
        ),
      );
      catalogNodesToCopy = allCatalog.filter((n) =>
        subtreeIds.has(n._id as string),
      );
    }

    // Never copy depth-0 nodes even when descendants are requested.
    catalogNodesToCopy = catalogNodesToCopy.filter((node) => node.depth > 0);

    // Load existing tenant slugs to skip duplicates
    const existingTenantRows = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
      .collect();
    const existingSlugs = new Set(existingTenantRows.map((r) => r.slug));

    // Compute a starting sortOrder beyond existing rows
    const baseSortOrder =
      existingTenantRows.length > 0
        ? Math.max(...existingTenantRows.map((r) => r.sortOrder)) + 1
        : 0;

    // Map catalogNodeId → new tenant category Id (for re-linking parentId)
    // Also include catalog→tenant links that already exist from previous copies
    const catalogToTenant = new Map<string, Id<"categories">>(
      existingTenantRows
        .filter((r) => r.catalogNodeId)
        .map((r) => [r.catalogNodeId! as string, r._id]),
    );

    const created: Id<"categories">[] = [];
    let sortOffset = 0;

    for (const catalogNode of catalogNodesToCopy) {
      const tenantLabel = resolveCatalogDisplayLabel(catalogNode, catalogLocale);
      const slug =
        slugifyCategoryLabel(tenantLabel) || catalogNode.slug;

      if (existingSlugs.has(slug)) {
        // Already exists — record the existing ID for parentId remapping
        const existing = existingTenantRows.find((r) => r.slug === slug);
        if (existing) {
          catalogToTenant.set(catalogNode._id as string, existing._id);
        }
        continue;
      }

      // Remap parentId: if the parent catalog node was also copied (in this
      // batch or a previous one), link to the tenant category equivalent.
      const remappedParentId = catalogNode.parentId
        ? catalogToTenant.get(catalogNode.parentId as string)
        : undefined;

      const newId = await ctx.db.insert("categories", {
        tenantSlug,
        label: tenantLabel,
        slug,
        iconKey: catalogNode.iconKey ?? "default",
        sortOrder: baseSortOrder + sortOffset,
        updatedAt: Date.now(),
        catalogNodeId: catalogNode._id,
        parentId: remappedParentId,
        depth: catalogNode.depth,
        isSelectable: true,
      });

      catalogToTenant.set(catalogNode._id as string, newId);
      existingSlugs.add(slug);
      created.push(newId);
      sortOffset += 1;
    }

    return { created: created.length, skipped: catalogNodesToCopy.length - created.length };
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
