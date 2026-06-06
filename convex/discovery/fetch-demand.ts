import { normalizeScoringKey } from "./scoring";

export type FetchDemand = {
  categories: string[];
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
    return { categories: normalizedSeeds.slice(0, maxCategories) };
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
