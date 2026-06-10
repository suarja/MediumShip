import type { QueryCtx } from "../_generated/server";
import { normalizeScoringKey } from "../discovery/scoring";

const TOP_CATEGORIES_CAP = 5;
const TOP_TAGS_CAP = 5;
const TOP_TYPES_CAP = 3;
const RECENT_INTERACTION_DAYS = 30;

export type TasteSignalSummary = {
  topCategories: Array<{ key: string; score: number }>;
  topTags: Array<{ key: string; score: number }>;
  topContentTypes: Array<{ key: string; score: number }>;
  explicitInterests: string[];
  recentOpens: number;
  recentFinishes: number;
  bookmarkCount: number;
  isColdStart: boolean;
};

function topByScore(
  rows: Array<{ key: string; score: number }>,
  cap: number,
): Array<{ key: string; score: number }> {
  return [...rows]
    .sort((left, right) => right.score - left.score)
    .slice(0, cap);
}

/**
 * Aggregates read-only taste signals for prompt input. No PII — only normalized
 * category/tag keys and counts.
 */
export async function summarizeSignals(
  ctx: QueryCtx,
  tokenIdentifier: string,
  tenantSlug: string,
  now: number = Date.now(),
): Promise<TasteSignalSummary> {
  const prefs = await ctx.db
    .query("userPreferences")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .collect();

  const tenantPrefs = prefs.filter((row) => row.tenantSlug === tenantSlug);

  const categories = topByScore(
    tenantPrefs
      .filter((row) => row.targetType === "category")
      .map((row) => ({ key: row.targetId, score: row.score })),
    TOP_CATEGORIES_CAP,
  );

  const tags = topByScore(
    tenantPrefs
      .filter((row) => row.targetType === "tag")
      .map((row) => ({ key: row.targetId, score: row.score })),
    TOP_TAGS_CAP,
  );

  const contentTypes = topByScore(
    tenantPrefs
      .filter((row) => row.targetType === "contentType")
      .map((row) => ({ key: row.targetId, score: row.score })),
    TOP_TYPES_CAP,
  );

  const interestRows = await ctx.db
    .query("categoryInterests")
    .withIndex("by_tokenIdentifier_and_tenant", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier).eq("tenantSlug", tenantSlug),
    )
    .collect();

  const explicitInterests = interestRows.map((row) =>
    normalizeScoringKey(row.categoryKey),
  );

  const recentCutoff = now - RECENT_INTERACTION_DAYS * 24 * 60 * 60 * 1000;

  const interactions = await ctx.db
    .query("contentInteractions")
    .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .collect();

  const recentTenantInteractions = interactions.filter(
    (row) => row.tenantSlug === tenantSlug && row.createdAt >= recentCutoff,
  );

  const recentOpens = recentTenantInteractions.filter(
    (row) => row.type === "open",
  ).length;
  const recentFinishes = recentTenantInteractions.filter(
    (row) => row.type === "finish",
  ).length;

  const bookmarks = await ctx.db
    .query("bookmarks")
    .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .collect();

  const bookmarkCount = bookmarks.length;

  const isColdStart =
    categories.length === 0 &&
    tags.length === 0 &&
    contentTypes.length === 0 &&
    explicitInterests.length === 0 &&
    recentOpens === 0 &&
    recentFinishes === 0 &&
    bookmarkCount === 0;

  return {
    topCategories: categories,
    topTags: tags,
    topContentTypes: contentTypes,
    explicitInterests,
    recentOpens,
    recentFinishes,
    bookmarkCount,
    isColdStart,
  };
}
