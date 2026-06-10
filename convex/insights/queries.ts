import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { query, type QueryCtx } from "../_generated/server";
import { requireMember } from "../entitlements/authz";
import { isContentVisible } from "../discovery/visibility";
import { formatDayKey } from "./dayKey";

const LIST_CAP = 60;
const UNSEEN_WINDOW_MS = 48 * 60 * 60 * 1000;

const relatedContentValidator = v.object({
  _id: v.id("contents"),
  kind: v.union(
    v.literal("article"),
    v.literal("episode"),
    v.literal("video"),
  ),
  title: v.string(),
  summary: v.string(),
  category: v.string(),
  slug: v.string(),
  isPremium: v.boolean(),
  heroImageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  readingTimeMinutes: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
});

const analysisValidator = v.object({
  _id: v.id("tasteAnalysis"),
  dayKey: v.string(),
  tasteText: v.string(),
  model: v.string(),
  createdAt: v.number(),
  seenAt: v.optional(v.number()),
  related: v.array(relatedContentValidator),
});

const analysisSummaryValidator = v.object({
  _id: v.id("tasteAnalysis"),
  dayKey: v.string(),
  tasteText: v.string(),
  createdAt: v.number(),
  seenAt: v.optional(v.number()),
  previewTitle: v.optional(v.string()),
});

async function loadPublishedRelated(
  ctx: QueryCtx,
  tenantSlug: string,
  relatedContentIds: readonly Id<"contents">[],
): Promise<Array<Doc<"contents">>> {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
    .unique();

  const enabledModules = tenant?.enabledModules ?? [];
  const related: Array<Doc<"contents">> = [];

  for (const contentId of relatedContentIds) {
    const content = await ctx.db.get(contentId);
    if (
      content &&
      content.status === "published" &&
      content.tenantSlug === tenantSlug &&
      isContentVisible(content, enabledModules)
    ) {
      related.push(content);
    }
  }

  return related;
}

function toRelatedPayload(content: Doc<"contents">) {
  return {
    _id: content._id,
    kind: content.kind,
    title: content.title,
    summary: content.summary,
    category: content.category,
    slug: content.slug,
    isPremium: content.isPremium,
    heroImageUrl: content.heroImageUrl,
    publishedAt: content.publishedAt,
    readingTimeMinutes: content.readingTimeMinutes,
    durationSeconds: content.durationSeconds,
  };
}

async function loadAnalysisForMember(
  ctx: QueryCtx,
  tokenIdentifier: string,
  analysisId: Id<"tasteAnalysis">,
) {
  const analysis = await ctx.db.get(analysisId);
  if (!analysis || analysis.tokenIdentifier !== tokenIdentifier) {
    return null;
  }

  const relatedDocs = await loadPublishedRelated(
    ctx,
    analysis.tenantSlug,
    analysis.relatedContentIds,
  );

  return {
    _id: analysis._id,
    dayKey: analysis.dayKey,
    tasteText: analysis.tasteText,
    model: analysis.model,
    createdAt: analysis.createdAt,
    seenAt: analysis.seenAt,
    related: relatedDocs.map(toRelatedPayload),
  };
}

export const getAnalysisById = query({
  args: {
    analysisId: v.id("tasteAnalysis"),
  },
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    return loadAnalysisForMember(ctx, entitlement.tokenIdentifier, args.analysisId);
  },
});

export const getTodayAnalysis = query({
  args: {
    dayKey: v.optional(v.string()),
  },
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const dayKey = args.dayKey ?? formatDayKey(Date.now());

    const analysis = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_dayKey", (q) =>
        q
          .eq("tokenIdentifier", entitlement.tokenIdentifier)
          .eq("dayKey", dayKey),
      )
      .unique();

    if (!analysis) {
      return null;
    }

    return loadAnalysisForMember(ctx, entitlement.tokenIdentifier, analysis._id);
  },
});

export const getUnseenAnalysis = query({
  args: {
    now: v.optional(v.number()),
  },
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const now = args.now ?? Date.now();
    const cutoff = now - UNSEEN_WINDOW_MS;

    const rows = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(10);

    const unseen = rows.find(
      (row) => row.seenAt === undefined && row.createdAt >= cutoff,
    );

    if (!unseen) {
      return null;
    }

    return loadAnalysisForMember(ctx, entitlement.tokenIdentifier, unseen._id);
  },
});

export const listMyAnalyses = query({
  args: {},
  returns: v.array(analysisSummaryValidator),
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);

    const rows = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(LIST_CAP);

    const summaries = [];

    for (const row of rows) {
      const firstRelatedId = row.relatedContentIds[0];
      let previewTitle: string | undefined;

      if (firstRelatedId) {
        const content = await ctx.db.get(firstRelatedId);
        if (content?.status === "published") {
          previewTitle = content.title;
        }
      }

      summaries.push({
        _id: row._id,
        dayKey: row.dayKey,
        tasteText: row.tasteText,
        createdAt: row.createdAt,
        seenAt: row.seenAt,
        previewTitle,
      });
    }

    return summaries;
  },
});
