import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";
import { DEFAULT_RELATED_LIMIT, pickRelated } from "./relatedSelection";
import { summarizeSignals } from "./signals";

const relatedPickValidator = v.object({
  contentId: v.id("contents"),
  rationale: v.string(),
});

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

/** True when the member still has a briefing they have not opened (seenAt unset). */
export const memberHasUnseenBriefing = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .order("desc")
      .first();

    return latest !== null && latest.seenAt === undefined;
  },
});

export const getTasteThreadId = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();

    return user?.tasteInsightsThreadId ?? null;
  },
});

export const saveTasteThreadId = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        tasteInsightsThreadId: args.threadId,
      });
    }

    return null;
  },
});

export const loadPreviousAnalysis = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    beforeCreatedAt: v.number(),
  },
  returns: v.union(
    v.object({
      dayKey: v.string(),
      overview: v.string(),
      reflection: v.optional(v.string()),
      trends: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .order("desc")
      .take(5);

    const previous = rows.find((row) => row.createdAt < args.beforeCreatedAt);
    if (!previous) {
      return null;
    }

    return {
      dayKey: previous.dayKey,
      overview: previous.tasteText,
      reflection: previous.reflection,
      trends: previous.trends,
    };
  },
});

export const insertTasteAnalysis = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    dayKey: v.string(),
    tasteText: v.string(),
    reflection: v.optional(v.string()),
    trends: v.optional(v.string()),
    relatedPicks: v.array(relatedPickValidator),
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
      reflection: args.reflection,
      trends: args.trends,
      relatedPicks: args.relatedPicks,
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
    recentTitles: v.array(v.string()),
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

export const loadRelatedCandidates = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    now: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("contents"),
      kind: v.union(
        v.literal("article"),
        v.literal("episode"),
        v.literal("video"),
      ),
      title: v.string(),
      summary: v.string(),
      category: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const ids = await pickRelated(
      ctx,
      args.tokenIdentifier,
      args.tenantSlug,
      args.limit ?? DEFAULT_RELATED_LIMIT,
      args.now,
    );

    const contents: Array<Doc<"contents">> = [];
    for (const contentId of ids) {
      const content = await ctx.db.get(contentId);
      if (content && content.status === "published") {
        contents.push(content);
      }
    }

    return contents.map((content) => ({
      _id: content._id,
      kind: content.kind,
      title: content.title,
      summary: content.summary,
      category: content.category,
    }));
  },
});
