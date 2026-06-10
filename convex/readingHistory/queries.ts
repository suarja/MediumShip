import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { query, type QueryCtx } from "../_generated/server";
import { requireMember } from "../entitlements/authz";
import {
  isResumableProgress,
  progressRatioFromSeconds,
} from "../playbackProgress/resume";

const HISTORY_LIMIT = 50;
const HISTORY_SCAN_WINDOW = 200;
const RESUME_SCAN_WINDOW = 20;

const mediaKind = v.union(v.literal("episode"), v.literal("video"));

const resumeItemValidator = v.object({
  contentId: v.id("contents"),
  kind: mediaKind,
  title: v.string(),
  heroImageUrl: v.optional(v.string()),
  seconds: v.number(),
  durationSeconds: v.optional(v.number()),
  progressRatio: v.number(),
});

const historyItemValidator = v.object({
  contentId: v.id("contents"),
  kind: v.union(
    v.literal("article"),
    v.literal("episode"),
    v.literal("video"),
  ),
  title: v.string(),
  heroImageUrl: v.optional(v.string()),
  canonicalUrl: v.optional(v.string()),
  openedAt: v.number(),
  progressRatio: v.optional(v.number()),
});

async function clearedAtForMember(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<number> {
  const state = await ctx.db
    .query("readingHistoryState")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  return state?.clearedAt ?? 0;
}

function isPublishedContent(content: Doc<"contents"> | null): content is Doc<"contents"> {
  return content !== null && content.status === "published";
}

function isMediaKind(kind: Doc<"contents">["kind"]): kind is "episode" | "video" {
  return kind === "episode" || kind === "video";
}

async function playbackProgressForContent(
  ctx: QueryCtx,
  tokenIdentifier: string,
  contentId: Id<"contents">,
): Promise<Doc<"playbackProgress"> | null> {
  return (
    (await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_contentId", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("contentId", contentId),
      )
      .unique()) ?? null
  );
}

export const getResume = query({
  args: {},
  returns: v.union(resumeItemValidator, v.null()),
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);

    const candidates = await ctx.db
      .query("playbackProgress")
      .withIndex("by_tokenIdentifier_and_updatedAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(RESUME_SCAN_WINDOW);

    for (const progress of candidates) {
      const content = await ctx.db.get(progress.contentId);
      if (!isPublishedContent(content) || !isMediaKind(content.kind)) {
        continue;
      }

      if (!isResumableProgress(progress.seconds, content.durationSeconds)) {
        continue;
      }

      const progressRatio =
        progressRatioFromSeconds(progress.seconds, content.durationSeconds) ?? 0;

      return {
        contentId: content._id,
        kind: content.kind,
        title: content.title,
        heroImageUrl: content.heroImageUrl,
        seconds: progress.seconds,
        durationSeconds: content.durationSeconds,
        progressRatio,
      };
    }

    return null;
  },
});

export const getReadingHistory = query({
  args: {},
  returns: v.array(historyItemValidator),
  handler: async (ctx) => {
    const entitlement = await requireMember(ctx);
    const clearedAt = await clearedAtForMember(ctx, entitlement.tokenIdentifier);

    const interactions = await ctx.db
      .query("contentInteractions")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", entitlement.tokenIdentifier),
      )
      .order("desc")
      .take(HISTORY_SCAN_WINDOW);

    const seenContentIds = new Set<Id<"contents">>();
    const items: Array<{
      contentId: Id<"contents">;
      kind: Doc<"contents">["kind"];
      title: string;
      heroImageUrl?: string;
      canonicalUrl?: string;
      openedAt: number;
      progressRatio?: number;
    }> = [];

    for (const interaction of interactions) {
      if (interaction.type !== "open" || interaction.createdAt <= clearedAt) {
        continue;
      }

      if (seenContentIds.has(interaction.contentId)) {
        continue;
      }

      const content = await ctx.db.get(interaction.contentId);
      if (!isPublishedContent(content)) {
        continue;
      }

      seenContentIds.add(interaction.contentId);

      const progress = await playbackProgressForContent(
        ctx,
        entitlement.tokenIdentifier,
        content._id,
      );

      const progressRatio =
        progress !== null
          ? progressRatioFromSeconds(progress.seconds, content.durationSeconds)
          : undefined;

      items.push({
        contentId: content._id,
        kind: content.kind,
        title: content.title,
        heroImageUrl: content.heroImageUrl,
        canonicalUrl: content.canonicalUrl,
        openedAt: interaction.createdAt,
        ...(progressRatio !== undefined ? { progressRatio } : {}),
      });

      if (items.length >= HISTORY_LIMIT) {
        break;
      }
    }

    return items;
  },
});
