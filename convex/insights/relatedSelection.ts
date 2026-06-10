import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadMemberCategoryInterests } from "../categories/interests";
import {
  scoreContent,
  type Affinity,
} from "../discovery/scoring";
import { isContentVisible } from "../discovery/visibility";
import { buildDaySeededRng } from "./seededRng";

export const DEFAULT_RELATED_LIMIT = 4;
export const MAX_RELATED_LIMIT = 5;

/**
 * Number of past briefings whose relatedContentIds are excluded from new picks
 * to ensure rotation across briefings.
 */
export const RECENTLY_PROPOSED_BRIEFINGS = 5;

/** Cap Wikipedia-heavy briefings — discovery ingests many wiki stubs. */
export const MAX_WIKIPEDIA_PICKS = 2;

type ScoredCandidate = {
  id: Id<"contents">;
  score: number;
  content: Doc<"contents">;
};

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

async function loadExcludedContentIds(
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

/**
 * Loads content IDs already proposed in the most recent `RECENTLY_PROPOSED_BRIEFINGS`
 * briefings, to enable rotation.
 */
async function loadRecentlyProposedContentIds(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<Set<Id<"contents">>> {
  const recentBriefings = await ctx.db
    .query("tasteAnalysis")
    .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .order("desc")
    .take(RECENTLY_PROPOSED_BRIEFINGS);

  const ids = new Set<Id<"contents">>();
  for (const briefing of recentBriefings) {
    for (const contentId of briefing.relatedContentIds) {
      ids.add(contentId);
    }
  }
  return ids;
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

function referenceTimeFrom(contents: readonly Doc<"contents">[]): number {
  return contents.reduce((max, content) => {
    const published = content.publishedAt ? Date.parse(content.publishedAt) : 0;
    return Math.max(max, published);
  }, 0);
}

function isYouTubeVideo(content: Doc<"contents">): boolean {
  return (
    content.kind === "video" &&
    (content.source === "youtube" ||
      content.videoSource?.kind === "youtube")
  );
}

function canTryAdd(
  content: Doc<"contents">,
  wikipediaCount: number,
): boolean {
  if (content.source === "wikipedia" && wikipediaCount >= MAX_WIKIPEDIA_PICKS) {
    return false;
  }
  return true;
}

/**
 * Ensures briefing picks span formats: at least one YouTube video when available,
 * caps Wikipedia articles, then fills by score.
 */
export function applyInsightsPickDiversity(
  scored: readonly ScoredCandidate[],
  limit: number,
  enabledModules: readonly string[],
): Id<"contents">[] {
  const cappedLimit = Math.min(Math.max(limit, 1), MAX_RELATED_LIMIT);
  const picks: Id<"contents">[] = [];
  const used = new Set<Id<"contents">>();
  let wikipediaCount = 0;

  const add = (entry: ScoredCandidate): boolean => {
    if (picks.length >= cappedLimit || used.has(entry.id)) {
      return false;
    }
    if (!canTryAdd(entry.content, wikipediaCount)) {
      return false;
    }
    picks.push(entry.id);
    used.add(entry.id);
    if (entry.content.source === "wikipedia") {
      wikipediaCount += 1;
    }
    return true;
  };

  const videosEnabled = enabledModules.includes("videos");
  const episodesEnabled = enabledModules.includes("episodes");

  if (videosEnabled) {
    const bestYouTube = scored.find((entry) => isYouTubeVideo(entry.content));
    if (bestYouTube) {
      add(bestYouTube);
    }
  }

  if (episodesEnabled) {
    const bestEpisode = scored.find(
      (entry) => entry.content.kind === "episode" && !used.has(entry.id),
    );
    if (bestEpisode) {
      add(bestEpisode);
    }
  }

  for (const entry of scored) {
    if (picks.length >= cappedLimit) {
      break;
    }
    add(entry);
  }

  return picks;
}

function popularityFallback(
  visible: readonly Doc<"contents">[],
  excluded: Set<Id<"contents">>,
  hidden: Set<Id<"contents">>,
  limit: number,
  enabledModules: readonly string[],
): Id<"contents">[] {
  const eligible = [...visible]
    .filter(
      (content) => !excluded.has(content._id) && !hidden.has(content._id),
    )
    .sort((left, right) => {
      const leftAt = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightAt = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightAt - leftAt;
    });

  const scored: ScoredCandidate[] = eligible.map((content) => ({
    id: content._id,
    score: 0,
    content,
  }));

  return applyInsightsPickDiversity(scored, limit, enabledModules);
}

/**
 * Related-content selection via the discovery scoring policy.
 *
 * - Excludes open/finish/hide interactions.
 * - Excludes content already proposed in the last RECENTLY_PROPOSED_BRIEFINGS
 *   briefings (rotation), with a graceful fallback when the catalog is small.
 * - Scoring is seeded by dayKey + tokenIdentifier for day-stable but
 *   day-varying novelty.
 *
 * Only published, tenant-visible items are considered.
 */
export async function pickRelated(
  ctx: QueryCtx,
  tokenIdentifier: string,
  tenantSlug: string,
  limit: number = DEFAULT_RELATED_LIMIT,
  now: number = Date.now(),
  dayKey?: string,
): Promise<Id<"contents">[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), MAX_RELATED_LIMIT);
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
    .unique();

  const enabledModules = tenant?.enabledModules ?? [];

  const published = await ctx.db
    .query("contents")
    .withIndex("by_tenant_and_status", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "published"),
    )
    .collect();

  const visible = published.filter((content) =>
    isContentVisible(content, enabledModules),
  );

  const hidden = await loadHiddenContentIds(ctx, tokenIdentifier);
  const excluded = await loadExcludedContentIds(ctx, tokenIdentifier);
  const recentlyProposed = await loadRecentlyProposedContentIds(ctx, tokenIdentifier);
  const affinities = await loadAffinities(ctx, tokenIdentifier);
  const interestCategories = await loadMemberCategoryInterests(
    ctx,
    tokenIdentifier,
    tenantSlug,
  );

  // Derive the effective day key for the seed (stable per day per member).
  const effectiveDayKey = dayKey ?? new Date(now).toISOString().slice(0, 10);
  const rng = buildDaySeededRng(effectiveDayKey, tokenIdentifier);

  const referenceTime = referenceTimeFrom(visible);

  // Hard-excluded: opened / finished / hidden (never show).
  const hardExcluded = new Set<Id<"contents">>([...excluded, ...hidden]);

  // Primary candidates: hard-excluded removed AND not recently proposed.
  const primaryCandidates = visible.filter(
    (content) =>
      !hardExcluded.has(content._id) && !recentlyProposed.has(content._id),
  );

  // Secondary candidates (fallback pool): hard-excluded removed but
  // recently proposed — used only when primary pool is too small.
  const secondaryCandidates = visible.filter(
    (content) =>
      !hardExcluded.has(content._id) && recentlyProposed.has(content._id),
  );

  function scoreAndSort(items: readonly Doc<"contents">[]): ScoredCandidate[] {
    return items
      .map((content) => ({
        id: content._id,
        content,
        score: scoreContent(content, affinities, referenceTime || now, {
          interestCategories,
          rng,
        }),
      }))
      .sort((left, right) => right.score - left.score);
  }

  // If no candidates at all (not even hard-excluded ones remain), fall back to
  // the popularity heuristic.
  if (visible.filter((c) => !hardExcluded.has(c._id)).length === 0) {
    return popularityFallback(
      visible,
      excluded,
      hidden,
      cappedLimit,
      enabledModules,
    );
  }

  // Score primary candidates and check if they fill the limit.
  const scoredPrimary = scoreAndSort(primaryCandidates);
  const picksFromPrimary = applyInsightsPickDiversity(
    scoredPrimary,
    cappedLimit,
    enabledModules,
  );

  if (picksFromPrimary.length >= cappedLimit) {
    // Primary pool is sufficient — no recycling needed.
    return picksFromPrimary;
  }

  // Primary pool is too small. Backfill with recently-proposed items (recycling
  // is preferable to returning fewer picks than requested).
  const alreadyPicked = new Set(picksFromPrimary);
  const scoredSecondary = scoreAndSort(
    secondaryCandidates.filter((c) => !alreadyPicked.has(c._id)),
  );

  // Combine: fresh picks first (higher effective priority), recycled after.
  // We demote recycled items by shifting their score below any primary score.
  const lowestPrimaryScore = scoredPrimary.at(-1)?.score ?? 0;
  const demotedSecondary: ScoredCandidate[] = scoredSecondary.map((c) => ({
    ...c,
    score: Math.min(c.score, lowestPrimaryScore - 1),
  }));

  const combined = [...scoredPrimary, ...demotedSecondary];
  return applyInsightsPickDiversity(combined, cappedLimit, enabledModules);
}
