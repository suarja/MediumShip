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

function popularityFallback(
  visible: readonly Doc<"contents">[],
  excluded: Set<Id<"contents">>,
  hidden: Set<Id<"contents">>,
  limit: number,
): Id<"contents">[] {
  return [...visible]
    .filter(
      (content) => !excluded.has(content._id) && !hidden.has(content._id),
    )
    .sort((left, right) => {
      const leftAt = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightAt = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightAt - leftAt;
    })
    .slice(0, limit)
    .map((content) => content._id);
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
    return popularityFallback(visible, excluded, hidden, cappedLimit);
  }

  const scored = candidates
    .map((content) => ({
      id: content._id,
      score: scoreContent(content, affinities, referenceTime || now, {
        interestCategories,
        rng: () => 0,
      }),
    }))
    .sort((left, right) => right.score - left.score);

  const picks = scored.slice(0, cappedLimit).map((entry) => entry.id);

  if (picks.length < cappedLimit) {
    const picked = new Set(picks);
    for (const content of visible) {
      if (picks.length >= cappedLimit) {
        break;
      }
      if (
        !picked.has(content._id) &&
        !excluded.has(content._id) &&
        !hidden.has(content._id)
      ) {
        picks.push(content._id);
        picked.add(content._id);
      }
    }
  }

  return picks;
}
