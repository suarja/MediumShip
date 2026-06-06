import { v } from "convex/values";

import { internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import {
  aggregateCategoryAffinities,
  computeFetchDemand,
  SCHEDULED_INGESTION_DEMAND_OPTIONS,
} from "./fetchDemand";
import { PROVIDERS } from "./provider";

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
  source: v.union(v.literal("cms"), v.literal("wikipedia")),
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

export const listTenantsForIngestion = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      discoverySeedCategories: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();

    return tenants.map((tenant) => ({
      slug: tenant.slug,
      discoverySeedCategories: tenant.discoverySeedCategories,
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
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
      .unique();

    const preferences = await ctx.db.query("userPreferences").collect();
    const tenantPreferences = preferences.filter(
      (preference) => preference.tenantSlug === tenantSlug,
    );

    return {
      aggregatedAffinities: aggregateCategoryAffinities(tenantPreferences),
      seedCategories: tenant?.discoverySeedCategories ?? [],
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
    const tenants: Array<{
      slug: string;
      discoverySeedCategories?: string[];
    }> = await ctx.runQuery(internal.discovery.ingest.listTenantsForIngestion, {});

    let tenantsProcessed = 0;
    let totalUpserted = 0;

    for (const tenant of tenants) {
      const inputs: {
        aggregatedAffinities: Array<{ targetId: string; score: number }>;
        seedCategories: string[];
      } = await ctx.runQuery(internal.discovery.ingest.getTenantIngestionInputs, {
        tenantSlug: tenant.slug,
      });

      const demand = computeFetchDemand(
        inputs.aggregatedAffinities,
        inputs.seedCategories,
        SCHEDULED_INGESTION_DEMAND_OPTIONS,
      );

      if (demand.categories.length === 0) {
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
