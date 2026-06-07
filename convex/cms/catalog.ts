import { v } from "convex/values";

import { action, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  CATALOG_LOCALES,
  WIKIPEDIA_LOCALES,
} from "../categories/catalogLocale";
import {
  readCategoryCatalogRoots,
  readCategoryCatalogStats,
  searchCategoryCatalogNodes,
} from "../categories/catalogRead";
import { CATALOG_TAXONOMY_MAX_DEPTH } from "../categories/catalogLabelPolicy";
import {
  enrichCatalogSummariesWithTenantStatus,
  loadCatalogTenantStatusContext,
} from "../categories/catalogTenantStatus";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { requireCmsAdmin } from "./authz";

async function getTenantCatalogLocale(ctx: Parameters<typeof requireCmsAdmin>[0]) {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
    .unique();
  return tenant?.catalogLocale ?? "en";
}

/**
 * Returns aggregate stats for the global `categoryCatalog`.
 * CMS admin only.
 */
export const getCategoryCatalogStats = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);
    return await readCategoryCatalogStats(ctx);
  },
});

/**
 * Search the global catalog by label (accent-insensitive, depth cap 4).
 * Wide IPTC families (depth 0, 3+ meaningful words) are browse-only.
 * CMS admin only.
 */
export const searchCategoryCatalogForCms = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    if (!args.query.trim()) return [];

    const locale = await getTenantCatalogLocale(ctx);
    const summaries = await searchCategoryCatalogNodes(ctx, args.query, {
      maxDepth: CATALOG_TAXONOMY_MAX_DEPTH,
      locale,
    });
    const { tenantRows, catalogNodes } = await loadCatalogTenantStatusContext(
      ctx,
      defaultTenant.slug,
    );
    return enrichCatalogSummariesWithTenantStatus(
      summaries,
      tenantRows,
      catalogNodes,
      locale,
    );
  },
});

/**
 * L1 IPTC families for browse entry (chips). Compact labels (≤2 words) may
 * also be added directly; broad families drill into sub-themes via search.
 * CMS admin only.
 */
export const listCategoryCatalogRootsForCms = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);
    const locale = await getTenantCatalogLocale(ctx);
    return await readCategoryCatalogRoots(ctx, locale);
  },
});

/**
 * Discovery locale settings for CMS (catalog labels + Wikipedia ingestion).
 * CMS admin only.
 */
export const getDiscoveryLocales = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    return {
      catalogLocale: tenant?.catalogLocale ?? "en",
      wikipediaLocale: tenant?.wikipediaLocale ?? "en",
    };
  },
});

export const updateDiscoveryLocales = mutation({
  args: {
    catalogLocale: v.optional(
      v.union(...CATALOG_LOCALES.map((locale) => v.literal(locale))),
    ),
    wikipediaLocale: v.optional(
      v.union(...WIKIPEDIA_LOCALES.map((locale) => v.literal(locale))),
    ),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    if (args.catalogLocale === undefined && args.wikipediaLocale === undefined) {
      throw new Error("At least one locale must be provided");
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    const patch = {
      ...(args.catalogLocale !== undefined && {
        catalogLocale: args.catalogLocale,
      }),
      ...(args.wikipediaLocale !== undefined && {
        wikipediaLocale: args.wikipediaLocale,
      }),
    };

    if (tenant) {
      await ctx.db.patch(tenant._id, patch);
      return tenant._id;
    }

    return await ctx.db.insert("tenants", {
      slug: defaultTenant.slug,
      name: defaultTenant.name,
      enabledModules: defaultTenant.enabledModules,
      feedSections: defaultTenant.feedSections,
      themeConfig: defaultTenant.themeConfig,
      catalogLocale: args.catalogLocale ?? "en",
      wikipediaLocale: args.wikipediaLocale ?? "en",
    });
  },
});

/**
 * Schedule an async IPTC Media Topics import into `categoryCatalog`.
 * Prefer `importIptcForCms` from the CMS UI for immediate success/error feedback.
 * CMS admin only.
 */
export const triggerIptcImport = mutation({
  args: {
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

/**
 * Fetch IPTC Media Topics and upsert them into `categoryCatalog`.
 * Runs synchronously so the CMS can surface fetch/parse failures immediately.
 * CMS admin only.
 */
export const importIptcForCms = action({
  args: {
    url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ parsed: number; imported: number; frenchLabels: number }> => {
    await ctx.runQuery(internal.cms.authz.assertCmsAdmin, {});
    const result: { parsed: number; imported: number; frenchLabels: number } =
      await ctx.runAction(
      internal.categories.catalogImport.importIptcMediaTopics,
      { url: args.url },
    );
    return result;
  },
});
