import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadMemberCategoryInterests } from "../categories/interests";
import {
  scoreContent,
  type Affinity,
} from "../discovery/scoring";
import { isContentVisible } from "../discovery/visibility";

export const DEFAULT_RELATED_LIMIT = 4;
export const MAX_RELATED_LIMIT = 5;

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
 * Deterministic related-content selection via the discovery scoring policy.
 * Excludes open/finish/hide interactions; only published, tenant-visible items.
 */
export async function pickRelated(
  ctx: QueryCtx,
  tokenIdentifier: string,
  tenantSlug: string,
  limit: number = DEFAULT_RELATED_LIMIT,
  now: number = Date.now(),
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
  const affinities = await loadAffinities(ctx, tokenIdentifier);
  const interestCategories = await loadMemberCategoryInterests(
    ctx,
    tokenIdentifier,
    tenantSlug,
  );

  const referenceTime = referenceTimeFrom(visible);
  const candidates = visible.filter(
    (content) => !excluded.has(content._id) && !hidden.has(content._id),
  );

  if (candidates.length === 0) {
    return popularityFallback(
      visible,
      excluded,
      hidden,
      cappedLimit,
      enabledModules,
    );
  }

  const scored: ScoredCandidate[] = candidates
    .map((content) => ({
      id: content._id,
      content,
      score: scoreContent(content, affinities, referenceTime || now, {
        interestCategories,
        rng: () => 0,
      }),
    }))
    .sort((left, right) => right.score - left.score);

  return applyInsightsPickDiversity(scored, cappedLimit, enabledModules);
}
