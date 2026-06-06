import { v } from "convex/values";

import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { computeFetchDemand, SCHEDULED_INGESTION_DEMAND_OPTIONS } from "./fetchDemand";

/** Minimum interval between on-demand fetches for the same (tenant, category). */
export const REFILL_THROTTLE_MS = 60 * 1000;

export function isCategoryThrottled(
  record: { lastRequestedAt: number } | null,
  now: number,
  windowMs: number = REFILL_THROTTLE_MS,
): boolean {
  if (!record) {
    return false;
  }

  return now - record.lastRequestedAt < windowMs;
}

export const requestDiscoveryRefill = mutation({
  args: {
    tenantSlug: v.string(),
  },
  returns: v.object({
    scheduledCategories: v.array(v.string()),
  }),
  handler: async (ctx, { tenantSlug }) => {
    const inputs = await ctx.runQuery(
      internal.discovery.ingest.getTenantIngestionInputs,
      { tenantSlug },
    );

    const demand = computeFetchDemand(
      inputs.aggregatedAffinities,
      inputs.seedCategories,
      SCHEDULED_INGESTION_DEMAND_OPTIONS,
    );

    const now = Date.now();
    const scheduledCategories: string[] = [];

    for (const category of demand.categories) {
      const existing = await ctx.db
        .query("ingestionThrottle")
        .withIndex("by_tenant_and_category", (q) =>
          q.eq("tenantSlug", tenantSlug).eq("categoryKey", category),
        )
        .unique();

      if (isCategoryThrottled(existing, now)) {
        continue;
      }

      if (existing) {
        await ctx.db.patch(existing._id, { lastRequestedAt: now });
      } else {
        await ctx.db.insert("ingestionThrottle", {
          tenantSlug,
          categoryKey: category,
          lastRequestedAt: now,
        });
      }

      await ctx.scheduler.runAfter(0, internal.discovery.ingest.runRefillIngestion, {
        tenantSlug,
        category,
        coldStart: demand.coldStart,
      });

      scheduledCategories.push(category);
    }

    return { scheduledCategories };
  },
});
