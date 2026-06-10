import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import { pickRelated } from "./relatedSelection";
import { summarizeSignals } from "./signals";

export const getExistingAnalysisForDay = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    dayKey: v.string(),
  },
  returns: v.union(v.id("tasteAnalysis"), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_dayKey", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier).eq("dayKey", args.dayKey),
      )
      .unique();

    return existing?._id ?? null;
  },
});

export const insertTasteAnalysis = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    dayKey: v.string(),
    tasteText: v.string(),
    relatedContentIds: v.array(v.id("contents")),
    model: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("tasteAnalysis"),
  handler: async (ctx, args) => {
    return ctx.db.insert("tasteAnalysis", {
      tokenIdentifier: args.tokenIdentifier,
      tenantSlug: args.tenantSlug,
      dayKey: args.dayKey,
      tasteText: args.tasteText,
      relatedContentIds: args.relatedContentIds,
      model: args.model,
      createdAt: args.createdAt,
    });
  },
});

export const resolveMemberTenant = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    fallbackTenantSlug: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const pref = await ctx.db
      .query("userPreferences")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .first();

    if (pref?.tenantSlug) {
      return pref.tenantSlug;
    }

    const interest = await ctx.db
      .query("categoryInterests")
      .withIndex("by_tokenIdentifier_and_tenant", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .first();

    return interest?.tenantSlug ?? args.fallbackTenantSlug;
  },
});

export const loadSignalSummary = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    now: v.number(),
  },
  returns: v.object({
    topCategories: v.array(v.object({ key: v.string(), score: v.number() })),
    topTags: v.array(v.object({ key: v.string(), score: v.number() })),
    topContentTypes: v.array(v.object({ key: v.string(), score: v.number() })),
    explicitInterests: v.array(v.string()),
    recentOpens: v.number(),
    recentFinishes: v.number(),
    bookmarkCount: v.number(),
    isColdStart: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return summarizeSignals(
      ctx,
      args.tokenIdentifier,
      args.tenantSlug,
      args.now,
    );
  },
});

export const loadRelatedContentIds = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    now: v.number(),
  },
  returns: v.array(v.id("contents")),
  handler: async (ctx, args) => {
    return pickRelated(
      ctx,
      args.tokenIdentifier,
      args.tenantSlug,
      undefined,
      args.now,
    );
  },
});
