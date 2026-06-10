import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { query, type QueryCtx } from "../_generated/server";
import { requireMember } from "../entitlements/authz";
import { isContentVisible } from "../discovery/visibility";
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
  rationale: v.optional(v.string()),
  isLiked: v.boolean(),
});

const analysisValidator = v.object({
  _id: v.id("tasteAnalysis"),
  dayKey: v.string(),
  tasteText: v.string(),
  reflection: v.optional(v.string()),
  trends: v.optional(v.string()),
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

async function loadLikedContentIds(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<Set<Id<"contents">>> {
  const likes = await ctx.db
    .query("contentInteractions")
    .withIndex("by_tokenIdentifier_and_type", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier).eq("type", "like"),
    )
    .collect();

  return new Set(likes.map((row) => row.contentId));
}

async function loadPublishedRelated(
  ctx: QueryCtx,
  tenantSlug: string,
  relatedContentIds: readonly Id<"contents">[],
  rationaleByContentId: Map<Id<"contents">, string>,
  likedContentIds: Set<Id<"contents">>,
): Promise<
  Array<Doc<"contents"> & { rationale?: string; isLiked: boolean }>
> {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
    .unique();

  const enabledModules = tenant?.enabledModules ?? [];
  const related: Array<
    Doc<"contents"> & { rationale?: string; isLiked: boolean }
  > = [];

  for (const contentId of relatedContentIds) {
    const content = await ctx.db.get(contentId);
    if (
      content &&
      content.status === "published" &&
      content.tenantSlug === tenantSlug &&
      isContentVisible(content, enabledModules)
    ) {
      const rationale = rationaleByContentId.get(contentId);
      related.push({
        ...content,
        rationale,
        isLiked: likedContentIds.has(contentId),
      });
    }
  }

  return related;
}

function rationaleMapFromAnalysis(
  analysis: Doc<"tasteAnalysis">,
): Map<Id<"contents">, string> {
  const map = new Map<Id<"contents">, string>();
  if (analysis.relatedPicks) {
    for (const pick of analysis.relatedPicks) {
      map.set(pick.contentId, pick.rationale);
    }
  }
  return map;
}

function toRelatedPayload(
  content: Doc<"contents"> & { rationale?: string; isLiked: boolean },
) {
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
    rationale: content.rationale,
    isLiked: content.isLiked,
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

  const rationaleByContentId = rationaleMapFromAnalysis(analysis);
  const orderedIds =
    analysis.relatedPicks?.map((pick) => pick.contentId) ??
    analysis.relatedContentIds;

  const likedContentIds = await loadLikedContentIds(ctx, tokenIdentifier);

  const relatedDocs = await loadPublishedRelated(
    ctx,
    analysis.tenantSlug,
    orderedIds,
    rationaleByContentId,
    likedContentIds,
  );

  return {
    _id: analysis._id,
    dayKey: analysis.dayKey,
    tasteText: analysis.tasteText,
    reflection: analysis.reflection,
    trends: analysis.trends,
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
    dayKey: v.string(),
  },
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);

    const analysis = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_dayKey", (q) =>
        q
          .eq("tokenIdentifier", entitlement.tokenIdentifier)
          .eq("dayKey", args.dayKey),
      )
      .unique();

    if (!analysis) {
      return null;
    }

    return loadAnalysisForMember(ctx, entitlement.tokenIdentifier, analysis._id);
  },
});

export const getLatestAnalysis = query({
  args: {},
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);

    const analysis = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .first();

    if (!analysis) {
      return null;
    }

    return loadAnalysisForMember(ctx, entitlement.tokenIdentifier, analysis._id);
  },
});

export const getUnseenAnalysis = query({
  args: {
    /** Client clock for the 48h window — never default to server `Date.now()`. */
    now: v.optional(v.number()),
    /** @deprecated Use `now` — kept for clients deployed before rename. */
    asOf: v.optional(v.number()),
  },
  returns: v.union(analysisValidator, v.null()),
  handler: async (ctx, args) => {
    const entitlement = await requireMember(ctx);
    const asOf = args.now ?? args.asOf;
    const cutoff = asOf !== undefined ? asOf - UNSEEN_WINDOW_MS : undefined;

    const rows = await ctx.db
      .query("tasteAnalysis")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(10);

    const unseen = rows.find((row) => {
      if (row.seenAt !== undefined) {
        return false;
      }
      if (cutoff !== undefined && row.createdAt < cutoff) {
        return false;
      }
      return true;
    });

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
      const firstRelatedId =
        row.relatedPicks?.[0]?.contentId ?? row.relatedContentIds[0];
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
