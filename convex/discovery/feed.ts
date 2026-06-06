import { v } from "convex/values";

import { query, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  bucketFeed,
  createSeededRng,
  scoreContent,
  type Affinity,
  type FeedReason,
} from "./scoring";
import { isContentVisible } from "./visibility";

const DEFAULT_LIMIT = 20;
const GUEST_FEED_MIX = { editorial: 0.5, random: 0.5 } as const;
const MEMBER_FEED_MIX = {
  personalized: 0.6,
  archive: 0.2,
  editorial: 0.1,
  random: 0.1,
} as const;

export type DiscoveryFeedItem = Doc<"contents"> & {
  reason: FeedReason;
};

function recencyScore(content: Doc<"contents">): number {
  return content.publishedAt ? Date.parse(content.publishedAt) : 0;
}

function referenceTimeFrom(contents: readonly Doc<"contents">[]): number {
  return contents.reduce((max, content) => {
    const published = content.publishedAt ? Date.parse(content.publishedAt) : 0;
    return Math.max(max, published);
  }, 0);
}

function hashFeedSeed(tokenIdentifier: string, feedSeed: number): number {
  let hash = feedSeed >>> 0;

  for (let index = 0; index < tokenIdentifier.length; index += 1) {
    hash = (Math.imul(31, hash) + tokenIdentifier.charCodeAt(index)) >>> 0;
  }

  return hash;
}

async function loadHiddenContentIds(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<Set<Id<"contents">>> {
  const hidden = await ctx.db
    .query("contentInteractions")
    .withIndex("by_tokenIdentifier_and_type", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier).eq("type", "hide"),
    )
    .collect();

  return new Set(hidden.map((row) => row.contentId));
}

async function loadSeenContentIds(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<Set<Id<"contents">>> {
  const [opened, finished] = await Promise.all([
    ctx.db
      .query("contentInteractions")
      .withIndex("by_tokenIdentifier_and_type", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("type", "open"),
      )
      .collect(),
    ctx.db
      .query("contentInteractions")
      .withIndex("by_tokenIdentifier_and_type", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("type", "finish"),
      )
      .collect(),
  ]);

  return new Set(
    [...opened, ...finished].map((row) => row.contentId),
  );
}

async function loadAffinities(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<Affinity[]> {
  const prefs = await ctx.db
    .query("userPreferences")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .collect();

  return prefs.map((pref) => ({
    targetType: pref.targetType,
    targetId: pref.targetId,
    score: pref.score,
  }));
}

export const getDiscoveryFeed = query({
  args: {
    tenantSlug: v.string(),
    tokenIdentifier: v.optional(v.string()),
    limit: v.optional(v.number()),
    feedSeed: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("contents"),
      _creationTime: v.number(),
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
      readingTimeMinutes: v.optional(v.number()),
      articleBody: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
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
      reason: v.union(
        v.literal("personalized"),
        v.literal("archive"),
        v.literal("editorial"),
        v.literal("random"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_LIMIT;

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();

    const enabledModules = tenant?.enabledModules ?? [];

    const published = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();

    const visible = published.filter((content) =>
      isContentVisible(content, enabledModules),
    );

    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier =
      identity?.tokenIdentifier ?? args.tokenIdentifier ?? null;

    if (!tokenIdentifier) {
      const scored = visible.map((content) => ({
        id: content._id,
        content,
        score: recencyScore(content),
      }));

      const mixed = bucketFeed(scored, GUEST_FEED_MIX).slice(0, limit);

      return mixed.map((item) => ({
        ...item.content,
        reason: item.reason,
      }));
    }

    const hiddenIds = await loadHiddenContentIds(ctx, tokenIdentifier);
    const seenIds = await loadSeenContentIds(ctx, tokenIdentifier);
    const affinities = await loadAffinities(ctx, tokenIdentifier);
    const referenceTime = referenceTimeFrom(visible);
    const rng = createSeededRng(
      hashFeedSeed(tokenIdentifier, args.feedSeed ?? 0),
    );

    const eligible = visible.filter((content) => !hiddenIds.has(content._id));

    const scored = eligible.map((content) => ({
      id: content._id,
      content,
      score: scoreContent(content, affinities, referenceTime, {
        seen: seenIds.has(content._id),
        rng,
      }),
    }));

    const mixed = bucketFeed(scored, MEMBER_FEED_MIX, rng).slice(0, limit);

    return mixed.map((item) => ({
      ...item.content,
      reason: item.reason,
    }));
  },
});
