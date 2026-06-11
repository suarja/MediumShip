import { v } from "convex/values";

import { query, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { loadMemberCategoryInterests } from "../categories/interests";
import {
  bucketFeed,
  createSeededRng,
  normalizeScoringKey,
  scoreContent,
  type Affinity,
  type FeedReason,
} from "./scoring";
import { isContentVisible } from "./visibility";

// --- Bounded candidate pool constants ---
/** N — most-recent published items (publishedAt desc) */
const RECENCY_WINDOW = 250;
/** Max affinity/interest categories targeted for per-category fetch */
const AFFINITY_CATEGORIES_MAX = 6;
/** K — recent items per targeted category */
const PER_CATEGORY_RECENT = 40;
/** Kₐ — oldest items per targeted category (archive bucket feed) */
const PER_CATEGORY_ARCHIVE = 10;
/** R — deep random sample for serendipity (all-time, seed-derived offset) */
const DEEP_RANDOM_SAMPLE = 30;
// Pool ceiling ≈ RECENCY_WINDOW + AFFINITY_CATEGORIES_MAX*(PER_CATEGORY_RECENT+PER_CATEGORY_ARCHIVE) + DEEP_RANDOM_SAMPLE
// ≈ 250 + 6*(40+10) + 30 = 580 items, ~0.8 MB vs full 14 MB corpus.

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
    v.union(
      v.literal("cms"),
      v.literal("wikipedia"),
      v.literal("rss"),
      v.literal("youtube"),
    ),
  ),
  externalId: v.optional(v.string()),
  canonicalUrl: v.optional(v.string()),
  author: v.optional(v.string()),
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

/**
 * Builds a bounded pool of candidate content documents for the discovery feed.
 *
 * Replaces the old full-corpus `.collect()` with targeted index reads:
 *   1. Recency window  — RECENCY_WINDOW most-recent published items (publishedAt desc)
 *   2. Category slices — top AFFINITY_CATEGORIES_MAX categories (by affinity score ∪ member interest settings),
 *                        PER_CATEGORY_RECENT newest + PER_CATEGORY_ARCHIVE oldest per category
 *   3. Deep random     — DEEP_RANDOM_SAMPLE items from a seed-derived offset (serendipity, all-time)
 * Results are deduped by _id and filtered through isContentVisible.
 *
 * Guest path (no affinities / no interest categories): recency + random only.
 */
export async function loadFeedCandidates(
  ctx: QueryCtx,
  args: {
    tenantSlug: string;
    affinities: Affinity[];
    interestCategories: readonly string[];
    feedSeed: number;
    enabledModules: readonly string[];
  },
): Promise<Doc<"contents">[]> {
  const { tenantSlug, affinities, interestCategories, feedSeed, enabledModules } = args;
  const seen = new Map<string, Doc<"contents">>();

  // 1. Recency window — most-recent published items.
  const recent = await ctx.db
    .query("contents")
    .withIndex("by_tenant_and_status_and_publishedAt", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "published"),
    )
    .order("desc")
    .take(RECENCY_WINDOW);
  for (const doc of recent) {
    seen.set(doc._id, doc);
  }

  // 2. Category slices — targeted per-category fetch for personalization.
  // Determine the top affinity categories (by score desc, category-type only).
  const affinityCategories = affinities
    .filter((a) => a.targetType === "category")
    .sort((a, b) => b.score - a.score)
    .map((a) => a.targetId); // already normalized keys

  // Union with member interest categories (normalize to match scoring keys).
  const normalizedInterestCategories = interestCategories.map(normalizeScoringKey);
  const targetedCategories = [
    ...new Set([...affinityCategories, ...normalizedInterestCategories]),
  ].slice(0, AFFINITY_CATEGORIES_MAX);

  for (const categoryKey of targetedCategories) {
    // Fetch recent items in this category (desc).
    const catRecent = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q.eq("tenantSlug", tenantSlug).eq("status", "published").eq("category", categoryKey),
      )
      .order("desc")
      .take(PER_CATEGORY_RECENT);
    for (const doc of catRecent) {
      seen.set(doc._id, doc);
    }

    // Fetch oldest items in this category (asc) for the archive bucket.
    const catArchive = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q.eq("tenantSlug", tenantSlug).eq("status", "published").eq("category", categoryKey),
      )
      .order("asc")
      .take(PER_CATEGORY_ARCHIVE);
    for (const doc of catArchive) {
      seen.set(doc._id, doc);
    }
  }

  // 3. Deep random sample — serendipity from all-time corpus.
  // Derive a pseudo-random publishedAt threshold from feedSeed using the same
  // seeded RNG used in scoring, then range-scan from that offset.
  //
  // We approximate a random skip by computing a date offset from feedSeed.
  // The seed is an integer; map it to a year range 2000–2030.
  const seedNormalized = ((feedSeed >>> 0) % 10000) / 10000; // 0..1
  // Span between 2000-01-01 and 2026-01-01 in ms
  const epochStart = Date.parse("2000-01-01T00:00:00.000Z");
  const epochEnd = Date.parse("2026-01-01T00:00:00.000Z");
  const randomThresholdMs = epochStart + Math.floor(seedNormalized * (epochEnd - epochStart));
  const randomThresholdISO = new Date(randomThresholdMs).toISOString();

  const randomSample = await ctx.db
    .query("contents")
    .withIndex("by_tenant_and_status_and_publishedAt", (q) =>
      q
        .eq("tenantSlug", tenantSlug)
        .eq("status", "published")
        .gte("publishedAt", randomThresholdISO),
    )
    .order("asc")
    .take(DEEP_RANDOM_SAMPLE);
  for (const doc of randomSample) {
    seen.set(doc._id, doc);
  }

  // Apply visibility filter (module gates, premium gating, etc.).
  return [...seen.values()].filter((content) =>
    isContentVisible(content, enabledModules),
  );
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
    // Guest-local category interests — used to rank the feed for visitors who
    // have not signed in yet. Ignored for authenticated users (their stored
    // member interests take precedence).
    guestCategoryKeys: v.optional(v.array(v.string())),
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
        : (args.guestCategoryKeys ?? []);

    const visible = await loadFeedCandidates(ctx, {
      tenantSlug: args.tenantSlug,
      affinities,
      interestCategories,
      feedSeed,
      enabledModules,
    });

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
