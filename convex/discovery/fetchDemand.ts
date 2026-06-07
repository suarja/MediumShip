import { normalizeScoringKey } from "./scoring";

export type FetchDemand = {
  categories: string[];
  coldStart?: boolean;
  /** Bounded random-pick quota per ingestion run (ADR 0005 step 2). */
  serendipityCount?: number;
};

export type TenantCategoryPreference = {
  targetType: "category" | "tag" | "contentType";
  targetId: string;
  score: number;
};

export type AggregatedCategoryAffinity = {
  targetId: string;
  score: number;
};

export type FetchDemandOptions = {
  maxCategories?: number;
  diversitySlots?: number;
};

const DEFAULT_MAX_CATEGORIES = 5;
const DEFAULT_DIVERSITY_SLOTS = 2;

/** Deeper batch for scheduled cron + on-demand refill (Slice E). */
export const SCHEDULED_INGESTION_DEMAND_OPTIONS: FetchDemandOptions = {
  maxCategories: 8,
  diversitySlots: 3,
};

export function aggregateCategoryAffinities(
  preferences: readonly TenantCategoryPreference[],
): AggregatedCategoryAffinity[] {
  const totals = new Map<string, number>();

  for (const preference of preferences) {
    if (preference.targetType !== "category") {
      continue;
    }

    const targetId = normalizeScoringKey(preference.targetId);
    if (!targetId) {
      continue;
    }

    totals.set(targetId, (totals.get(targetId) ?? 0) + preference.score);
  }

  return [...totals.entries()]
    .map(([targetId, score]) => ({ targetId, score }))
    .sort((left, right) => right.score - left.score);
}

/** Member-picked categories from Settings — folded into ingestion demand. */
export const INTEREST_DEMAND_SCORE = 150;

export function aggregateInterestCategories(
  interests: readonly { categoryKey: string }[],
): AggregatedCategoryAffinity[] {
  const totals = new Map<string, number>();

  for (const interest of interests) {
    const targetId = normalizeScoringKey(interest.categoryKey);
    if (!targetId) {
      continue;
    }

    totals.set(targetId, (totals.get(targetId) ?? 0) + INTEREST_DEMAND_SCORE);
  }

  return [...totals.entries()]
    .map(([targetId, score]) => ({ targetId, score }))
    .sort((left, right) => right.score - left.score);
}

export function mergeCategoryAffinities(
  ...groups: readonly (readonly AggregatedCategoryAffinity[])[]
): AggregatedCategoryAffinity[] {
  const totals = new Map<string, number>();

  for (const group of groups) {
    for (const affinity of group) {
      totals.set(
        affinity.targetId,
        (totals.get(affinity.targetId) ?? 0) + affinity.score,
      );
    }
  }

  return [...totals.entries()]
    .map(([targetId, score]) => ({ targetId, score }))
    .sort((left, right) => right.score - left.score);
}

export function computeFetchDemand(
  aggregatedAffinities: readonly AggregatedCategoryAffinity[],
  seedCategories: readonly string[],
  opts: FetchDemandOptions = {},
): FetchDemand {
  const maxCategories = opts.maxCategories ?? DEFAULT_MAX_CATEGORIES;
  const diversitySlots = opts.diversitySlots ?? DEFAULT_DIVERSITY_SLOTS;
  const normalizedSeeds = [
    ...new Set(seedCategories.map(normalizeScoringKey).filter(Boolean)),
  ];

  if (aggregatedAffinities.length === 0) {
    return {
      categories: normalizedSeeds.slice(0, maxCategories),
      coldStart: true,
    };
  }

  const ranked = aggregatedAffinities
    .map((affinity) => ({
      targetId: normalizeScoringKey(affinity.targetId),
      score: affinity.score,
    }))
    .filter((affinity) => affinity.targetId.length > 0)
    .sort((left, right) => right.score - left.score);

  const topSlots = Math.max(0, maxCategories - diversitySlots);
  const top = ranked.slice(0, topSlots);
  const topIds = new Set(top.map((affinity) => affinity.targetId));

  const diversityPool = [
    ...normalizedSeeds.filter((seed) => !topIds.has(seed)),
    ...ranked
      .map((affinity) => affinity.targetId)
      .filter((targetId) => !topIds.has(targetId)),
  ];

  const diversity = [...new Set(diversityPool)].slice(0, diversitySlots);
  const categories = [...new Set([...top.map((item) => item.targetId), ...diversity])].slice(
    0,
    maxCategories,
  );

  return { categories };
}
