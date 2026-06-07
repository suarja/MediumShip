import { v } from "convex/values";

import { action, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  CATALOG_LOCALES,
  WIKIPEDIA_LOCALES,
  YOUTUBE_LOCALES,
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
import { YOUTUBE_WHITELIST } from "../discovery/providers/youtubeWhitelist";

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

    const wikipediaConfig = tenant?.providerConfigs?.wikipedia as
      | { locale?: "en" | "fr" }
      | undefined;

    return {
      catalogLocale: tenant?.catalogLocale ?? "en",
      wikipediaLocale: wikipediaConfig?.locale ?? "en",
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

    const existingConfigs = tenant?.providerConfigs ?? {};
    const wikipediaConfig =
      args.wikipediaLocale !== undefined
        ? {
            ...(existingConfigs.wikipedia ?? {}),
            locale: args.wikipediaLocale,
          }
        : existingConfigs.wikipedia;

    const patch = {
      ...(args.catalogLocale !== undefined && {
        catalogLocale: args.catalogLocale,
      }),
      ...(args.wikipediaLocale !== undefined && {
        providerConfigs: {
          ...existingConfigs,
          wikipedia: wikipediaConfig,
        },
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
      ...(args.wikipediaLocale !== undefined && {
        providerConfigs: {
          wikipedia: { locale: args.wikipediaLocale },
        },
      }),
    });
  },
});

/**
 * YouTube discovery ingestion settings for CMS (whitelist locale + opt-out).
 * CMS admin only.
 */
export const getYoutubeDiscoverySettings = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    const youtubeConfig = tenant?.providerConfigs?.youtube as
      | { locale?: "en" | "fr"; disableWhitelist?: boolean }
      | undefined;

    const locale = youtubeConfig?.locale ?? "fr";

    return {
      locale,
      disableWhitelist: youtubeConfig?.disableWhitelist ?? false,
      whitelistChannelCount: YOUTUBE_WHITELIST[locale].length,
      whitelistCounts: {
        fr: YOUTUBE_WHITELIST.fr.length,
        en: YOUTUBE_WHITELIST.en.length,
      },
    };
  },
});

export const updateYoutubeDiscoverySettings = mutation({
  args: {
    locale: v.optional(
      v.union(...YOUTUBE_LOCALES.map((locale) => v.literal(locale))),
    ),
    disableWhitelist: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    if (args.locale === undefined && args.disableWhitelist === undefined) {
      throw new Error("At least one YouTube setting must be provided");
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    const existingConfigs = tenant?.providerConfigs ?? {};
    const currentYoutube = (existingConfigs.youtube ?? {}) as {
      locale?: "en" | "fr";
      disableWhitelist?: boolean;
    };

    const youtubeConfig = {
      ...currentYoutube,
      ...(args.locale !== undefined && { locale: args.locale }),
      ...(args.disableWhitelist !== undefined && {
        disableWhitelist: args.disableWhitelist,
      }),
    };

    const patch = {
      providerConfigs: {
        ...existingConfigs,
        youtube: youtubeConfig,
      },
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
      catalogLocale: "en",
      providerConfigs: {
        youtube: youtubeConfig,
      },
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
