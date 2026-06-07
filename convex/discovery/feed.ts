import { v } from "convex/values";

import { query, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { loadMemberCategoryInterests } from "../categories/interests";
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
  isLiked: boolean;
};

const discoveryFeedItemValidator = v.object({
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
  source: v.optional(
    v.union(v.literal("cms"), v.literal("wikipedia"), v.literal("rss")),
  ),
  externalId: v.optional(v.string()),
  canonicalUrl: v.optional(v.string()),
  reason: v.union(
    v.literal("personalized"),
    v.literal("archive"),
    v.literal("editorial"),
    v.literal("random"),
  ),
  isLiked: v.boolean(),
});

export type OrderedFeedEntry = {
  content: Doc<"contents">;
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

export function hashFeedSeed(tokenIdentifier: string, feedSeed: number): number {
  let hash = feedSeed >>> 0;

  for (let index = 0; index < tokenIdentifier.length; index += 1) {
    hash = (Math.imul(31, hash) + tokenIdentifier.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function parseFeedCursor(cursor: string | null | undefined): number {
  if (cursor === null || cursor === undefined || cursor === "") {
    return 0;
  }

  const atIndex = cursor.indexOf("@");
  const raw = atIndex === -1 ? cursor : cursor.slice(0, atIndex);
  const offset = Number.parseInt(raw, 10);

  return Number.isFinite(offset) && offset >= 0 ? offset : 0;
}

export function encodeFeedCursor(offset: number): string {
  return String(offset);
}

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

  return new Set([...opened, ...finished].map((row) => row.contentId));
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

/** Builds a fresh-scored feed from unseen eligible content (no repeat recycling). */
export function buildOrderedDiscoveryFeed(args: {
  visible: readonly Doc<"contents">[];
  tokenIdentifier: string | null;
  feedSeed: number;
  hiddenIds: Set<Id<"contents">>;
  seenIds: Set<Id<"contents">>;
  affinities: Affinity[];
  interestCategories?: readonly string[];
}): { ordered: OrderedFeedEntry[] } {
  const referenceTime = referenceTimeFrom(args.visible);

  if (!args.tokenIdentifier) {
    const guestRng = createSeededRng(args.feedSeed);
    const scored = args.visible.map((content) => ({
      id: content._id,
      content,
      score: recencyScore(content),
    }));
    const mixed = bucketFeed(scored, GUEST_FEED_MIX, guestRng);
    return {
      ordered: mixed.map((item) => ({
        content: item.content,
        reason: item.reason,
      })),
    };
  }

  const rng = createSeededRng(hashFeedSeed(args.tokenIdentifier, args.feedSeed));
  const eligible = args.visible.filter(
    (content) => !args.hiddenIds.has(content._id),
  );

  const unseen = eligible.filter((content) => !args.seenIds.has(content._id));

  const unseenScored = unseen.map((content) => ({
    id: content._id,
    content,
    score: scoreContent(content, args.affinities, referenceTime, {
      rng,
      interestCategories: args.interestCategories,
    }),
  }));

  const unseenMixed = bucketFeed(unseenScored, MEMBER_FEED_MIX, rng);

  return {
    ordered: unseenMixed.map((item) => ({
      content: item.content,
      reason: item.reason,
    })),
  };
}

export function paginateOrderedFeed(args: {
  ordered: readonly OrderedFeedEntry[];
  cursor: string | null | undefined;
  limit: number;
}): {
  items: OrderedFeedEntry[];
  nextCursor: string | null;
  seekingFresh: boolean;
} {
  const offset = parseFeedCursor(args.cursor);
  const page = args.ordered.slice(offset, offset + args.limit);
  const nextOffset = offset + page.length;
  const hasMore = nextOffset < args.ordered.length;

  return {
    items: page,
    nextCursor: hasMore ? encodeFeedCursor(nextOffset) : null,
    seekingFresh: !hasMore && args.ordered.length > 0,
  };
}

export const getDiscoveryFeed = query({
  args: {
    tenantSlug: v.string(),
    tokenIdentifier: v.optional(v.string()),
    limit: v.optional(v.number()),
    feedSeed: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.object({
    items: v.array(discoveryFeedItemValidator),
    nextCursor: v.union(v.string(), v.null()),
    seekingFresh: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_LIMIT;
    const feedSeed = args.feedSeed ?? 0;

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

    const hiddenIds = tokenIdentifier
      ? await loadHiddenContentIds(ctx, tokenIdentifier)
      : new Set<Id<"contents">>();
    const likedIds = tokenIdentifier
      ? await loadLikedContentIds(ctx, tokenIdentifier)
      : new Set<Id<"contents">>();
    const seenIds = tokenIdentifier
      ? await loadSeenContentIds(ctx, tokenIdentifier)
      : new Set<Id<"contents">>();
    const affinities = tokenIdentifier
      ? await loadAffinities(ctx, tokenIdentifier)
      : [];
    const interestCategories =
      tokenIdentifier && identity
        ? await loadMemberCategoryInterests(ctx, tokenIdentifier, args.tenantSlug)
        : [];

    const { ordered } = buildOrderedDiscoveryFeed({
      visible,
      tokenIdentifier,
      feedSeed,
      hiddenIds,
      seenIds,
      affinities,
      interestCategories,
    });

    const page = paginateOrderedFeed({
      ordered,
      cursor: args.cursor,
      limit,
    });

    return {
      items: page.items.map((item) => ({
        ...item.content,
        reason: item.reason,
        isLiked: likedIds.has(item.content._id),
      })),
      nextCursor: page.nextCursor,
      seekingFresh: page.seekingFresh,
    };
  },
});
