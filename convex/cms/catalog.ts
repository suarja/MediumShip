import { v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireCmsAdmin } from "./authz";

/**
 * Returns aggregate stats for the global `categoryCatalog`.
 * CMS admin only.
 */
export const getCategoryCatalogStats = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);

    const all = await ctx.db.query("categoryCatalog").take(5000);
    const retired = all.filter((n) => n.retired).length;
    const active = all.length - retired;

    return { total: all.length, active, retired };
  },
});

/**
 * Search the global catalog by label (accent-insensitive, depth cap 3).
 * Returns an empty array when `query` is blank.
 * CMS admin only.
 */
export const searchCategoryCatalogForCms = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<
    Array<{
      _id: string;
      label: string;
      depth: number;
      externalId: string;
      slug: string;
      labelFr?: string;
      retired: boolean;
    }>
  > => {
    await requireCmsAdmin(ctx);

    if (!args.query.trim()) return [];

    const results = await ctx.runQuery(
      internal.categories.catalog.searchCategoryCatalog,
      { query: args.query, maxDepth: 3 },
    );

    return (results.filter(Boolean) as NonNullable<(typeof results)[number]>[]).map(
      (n) => ({
        _id: n._id as string,
        label: n.label,
        depth: n.depth,
        externalId: n.externalId,
        slug: n.slug,
        ...(n.labelFr !== undefined && { labelFr: n.labelFr }),
        retired: n.retired ?? false,
      }),
    );
  },
});

/**
 * List depth-0 (root) catalog nodes for the L1-chip hybrid entry.
 * CMS admin only.
 */
export const listCategoryCatalogRootsForCms = query({
  args: {},
  handler: async (ctx): Promise<
    Array<{
      _id: string;
      label: string;
      depth: number;
      externalId: string;
      slug: string;
      labelFr?: string;
      retired: boolean;
    }>
  > => {
    await requireCmsAdmin(ctx);

    const roots = await ctx.runQuery(
      internal.categories.catalog.listCategoryCatalogRoots,
      {},
    );

    return roots.map((n) => ({
      _id: n._id as string,
      label: n.label,
      depth: n.depth,
      externalId: n.externalId,
      slug: n.slug,
      ...(n.labelFr !== undefined && { labelFr: n.labelFr }),
      retired: n.retired ?? false,
    }));
  },
});

/**
 * Schedule an async IPTC Media Topics import into `categoryCatalog`.
 * The import runs in a Node action (network + large write); this mutation
 * only enqueues it so the CMS response stays fast.
 * CMS admin only.
 */
export const triggerIptcImport = mutation({
  args: {
    /** Override the IPTC URL — useful for pointing at a cached JSON copy. */
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    await ctx.scheduler.runAfter(
      0,
      internal.categories.catalogImport.importIptcMediaTopics,
      { url: args.url },
    );

    return { scheduled: true };
  },
});
