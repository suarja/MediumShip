import { v } from "convex/values";

import { internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import {
  aggregateCategoryAffinities,
  aggregateInterestCategories,
  computeFetchDemand,
  mergeCategoryAffinities,
  SCHEDULED_INGESTION_DEMAND_OPTIONS,
} from "./fetchDemand";
import { PROVIDERS } from "./provider";

/** Random articles per scheduled ingestion run — novelty outside seed affinities. */
export const SERENDIPITY_PER_RUN = 4;

const ingestedContentValidator = v.object({
  tenantSlug: v.string(),
  kind: v.union(
    v.literal("article"),
    v.literal("episode"),
    v.literal("video"),
  ),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived"),
  ),
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  isPremium: v.boolean(),
  heroImageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  durationSeconds: v.optional(v.number()),
  videoSource: v.optional(
    v.union(
      v.object({
        kind: v.literal("youtube"),
        youtubeVideoId: v.string(),
        youtubeUrl: v.string(),
      }),
      v.object({
        kind: v.literal("hosted"),
        uploadKey: v.string(),
        playbackUrl: v.string(),
      }),
    ),
  ),
  source: v.union(
    v.literal("cms"),
    v.literal("wikipedia"),
    v.literal("rss"),
    v.literal("youtube"),
  ),
  externalId: v.string(),
  canonicalUrl: v.string(),
});

export const upsertIngested = internalMutation({
  args: {
    items: v.array(ingestedContentValidator),
  },
  returns: v.object({ upserted: v.number() }),
  handler: async (ctx, { items }) => {
    let upserted = 0;

    for (const item of items) {
      const existing = await ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q
            .eq("tenantSlug", item.tenantSlug)
            .eq("source", item.source)
            .eq("externalId", item.externalId),
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("contents", item);
        upserted += 1;
      }
    }

    return { upserted };
  },
});

export const filterNewExternalIds = internalQuery({
  args: {
    tenantSlug: v.string(),
    source: v.union(
      v.literal("cms"),
      v.literal("wikipedia"),
      v.literal("rss"),
      v.literal("youtube"),
    ),
    externalIds: v.array(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, { tenantSlug, source, externalIds }) => {
    const novel: string[] = [];

    for (const externalId of externalIds) {
      const existing = await ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q
            .eq("tenantSlug", tenantSlug)
            .eq("source", source)
            .eq("externalId", externalId),
        )
        .unique();

      if (!existing) {
        novel.push(externalId);
      }
    }

    return novel;
  },
});

export const listIngestedExternalIds = internalQuery({
  args: {
    tenantSlug: v.string(),
    source: v.union(
      v.literal("cms"),
      v.literal("wikipedia"),
      v.literal("rss"),
      v.literal("youtube"),
    ),
  },
  returns: v.array(v.string()),
  handler: async (ctx, { tenantSlug, source }) => {
    const rows = await ctx.db
      .query("contents")
      .withIndex("by_tenant_source_external", (q) =>
        q.eq("tenantSlug", tenantSlug).eq("source", source),
      )
      .collect();

    return rows
      .map((row) => row.externalId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  },
});

export const getCategoryOffset = internalQuery({
  args: { tenantSlug: v.string(), category: v.string() },
  returns: v.number(),
  handler: async (ctx, { tenantSlug, category }) => {
    const record = await ctx.db
      .query("ingestionThrottle")
      .withIndex("by_tenant_and_category", (q) =>
        q.eq("tenantSlug", tenantSlug).eq("categoryKey", category),
      )
      .unique();

    return record?.searchOffset ?? 0;
  },
});

export const advanceCategoryOffset = internalMutation({
  args: { tenantSlug: v.string(), category: v.string(), by: v.number() },
  returns: v.null(),
  handler: async (ctx, { tenantSlug, category, by }) => {
    if (by <= 0) {
      return null;
    }

    const record = await ctx.db
      .query("ingestionThrottle")
      .withIndex("by_tenant_and_category", (q) =>
        q.eq("tenantSlug", tenantSlug).eq("categoryKey", category),
      )
      .unique();

    if (record) {
      await ctx.db.patch(record._id, {
        searchOffset: (record.searchOffset ?? 0) + by,
      });
    } else {
      await ctx.db.insert("ingestionThrottle", {
        tenantSlug,
        categoryKey: category,
        lastRequestedAt: Date.now(),
        searchOffset: by,
      });
    }

    return null;
  },
});

export const listTenantsForIngestion = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();

    return tenants.map((tenant) => ({
      slug: tenant.slug,
    }));
  },
});

export const getTenantIngestionInputs = internalQuery({
  args: { tenantSlug: v.string() },
  returns: v.object({
    aggregatedAffinities: v.array(
      v.object({
        targetId: v.string(),
        score: v.number(),
      }),
    ),
    seedCategories: v.array(v.string()),
  }),
  handler: async (ctx, { tenantSlug }) => {
    const taxonomyRows = await ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
      .collect();

    const seedCategories = taxonomyRows
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
      )
      .map((category) => category.label);

    const preferences = await ctx.db.query("userPreferences").collect();
    const tenantPreferences = preferences.filter(
      (preference) => preference.tenantSlug === tenantSlug,
    );

    const interestRows = await ctx.db
      .query("categoryInterests")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
      .collect();

    const aggregatedAffinities = mergeCategoryAffinities(
      aggregateCategoryAffinities(tenantPreferences),
      aggregateInterestCategories(interestRows),
    );

    return {
      aggregatedAffinities,
      seedCategories,
    };
  },
});

export const runDiscoveryIngestion = internalAction({
  args: {},
  returns: v.object({
    tenantsProcessed: v.number(),
    totalUpserted: v.number(),
  }),
  handler: async (ctx) => {
    const tenants: Array<{ slug: string }> = await ctx.runQuery(
      internal.discovery.ingest.listTenantsForIngestion,
      {},
    );

    let tenantsProcessed = 0;
    let totalUpserted = 0;

    for (const tenant of tenants) {
      const inputs: {
        aggregatedAffinities: Array<{ targetId: string; score: number }>;
        seedCategories: string[];
      } = await ctx.runQuery(internal.discovery.ingest.getTenantIngestionInputs, {
        tenantSlug: tenant.slug,
      });

      const demand = {
        ...computeFetchDemand(
          inputs.aggregatedAffinities,
          inputs.seedCategories,
          SCHEDULED_INGESTION_DEMAND_OPTIONS,
        ),
        serendipityCount: SERENDIPITY_PER_RUN,
      };

      const hasCategoryWork = demand.categories.length > 0;
      const hasSerendipityWork = (demand.serendipityCount ?? 0) > 0;
      if (!hasCategoryWork && !hasSerendipityWork) {
        continue;
      }

      tenantsProcessed += 1;

      for (const provider of PROVIDERS) {
        if (provider.source === "cms") {
          continue;
        }

        const result: { upserted: number } = await provider.ingest(ctx, {
          tenantSlug: tenant.slug,
          demand,
        });
        totalUpserted += result.upserted;
      }
    }

    return { tenantsProcessed, totalUpserted };
  },
});

export const runRefillIngestion = internalAction({
  args: {
    tenantSlug: v.string(),
    category: v.string(),
    coldStart: v.optional(v.boolean()),
  },
  returns: v.object({ upserted: v.number() }),
  handler: async (ctx, args) => {
    for (const provider of PROVIDERS) {
      if (provider.source === "cms") {
        continue;
      }

      const result: { upserted: number } = await provider.ingest(ctx, {
        tenantSlug: args.tenantSlug,
        demand: {
          categories: [args.category],
          coldStart: args.coldStart,
        },
      });

      return result;
    }

    return { upserted: 0 };
  },
});
