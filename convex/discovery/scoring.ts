export type FeedReason = "personalized" | "archive" | "editorial" | "random";

export type ScoredItem<T> = {
  id: string;
  content: T;
  score: number;
};

export type FeedItem<T> = {
  content: T;
  reason: FeedReason;
};

export type FeedMix = {
  personalized?: number;
  archive?: number;
  editorial?: number;
  random?: number;
};

export const INTERACTION_WEIGHTS = {
  view: 5,
  open: 20,
  skip: -10,
  like: 50,
  finish: 100,
  share: 80,
  hide: -100,
} as const;

/** Explicit member picks in Settings — distinct from interaction affinities. */
export const INTEREST_CATEGORY_BOOST = 80;
export const INTEREST_TAG_BOOST = 40;

export const DIMENSION_FACTORS = {
  category: 1.0,
  tag: 0.5,
  contentType: 0.2,
} as const;

export type InteractionType = keyof typeof INTERACTION_WEIGHTS;

export type TargetType = "category" | "tag" | "contentType";

export type Affinity = {
  targetType: TargetType;
  targetId: string;
  score: number;
};

export type InteractionSignal = {
  type: InteractionType;
  category: string;
  tags: readonly string[];
  kind: "article" | "episode" | "video";
};

export type ScoreableContent = {
  category: string;
  tags: readonly string[];
  kind: "article" | "episode" | "video";
  publishedAt?: string;
};

const MIN_AFFINITY_SCORE = -500;
const MAX_AFFINITY_SCORE = 1000;
const FRESHNESS_BOOST = 30;
const ARCHIVE_BOOST = 15;
const SEEN_PENALTY = 30;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000;

/** trim → lower → NFD strip accents → kebab-case slug */
export function normalizeScoringKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampAffinity(score: number): number {
  return Math.max(MIN_AFFINITY_SCORE, Math.min(MAX_AFFINITY_SCORE, score));
}

function upsertAffinityDelta(
  prefs: Affinity[],
  targetType: TargetType,
  rawTargetId: string,
  delta: number,
): Affinity[] {
  const targetId =
    targetType === "contentType" ? rawTargetId : normalizeScoringKey(rawTargetId);
  const index = prefs.findIndex(
    (pref) => pref.targetType === targetType && pref.targetId === targetId,
  );

  if (index === -1) {
    return [...prefs, { targetType, targetId, score: clampAffinity(delta) }];
  }

  const next = [...prefs];
  next[index] = {
    ...next[index],
    score: clampAffinity(next[index].score + delta),
  };
  return next;
}

export function applyInteraction(
  prefs: readonly Affinity[],
  signal: InteractionSignal,
): Affinity[] {
  const weight = INTERACTION_WEIGHTS[signal.type];
  let next = [...prefs];

  next = upsertAffinityDelta(
    next,
    "category",
    signal.category,
    weight * DIMENSION_FACTORS.category,
  );

  for (const tag of signal.tags) {
    next = upsertAffinityDelta(next, "tag", tag, weight * DIMENSION_FACTORS.tag);
  }

  next = upsertAffinityDelta(
    next,
    "contentType",
    signal.kind,
    weight * DIMENSION_FACTORS.contentType,
  );

  return next;
}

/** A recorded interaction with the content metadata needed to score it. */
export type ProjectableSignal = InteractionSignal & { contentId: string };

/**
 * Affinity is a pure projection of the **set** of (content, type) interactions,
 * not the stream of taps. Each (content, type) pair contributes its weight at
 * most once, so repeated likes/skips/views cannot inflate a score, and a
 * toggled-off `like` (its row removed) simply drops out of the set. This is the
 * idempotent counterpart of {@link applyInteraction}: fold the latter over the
 * deduplicated signal set starting from an empty profile.
 */
export function projectAffinities(
  signals: readonly ProjectableSignal[],
): Affinity[] {
  const seen = new Set<string>();
  let prefs: Affinity[] = [];

  for (const signal of signals) {
    const key = `${signal.contentId}/${signal.type}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    prefs = applyInteraction(prefs, signal);
  }

  return prefs;
}

function getAffinityScore(
  prefs: readonly Affinity[],
  targetType: TargetType,
  rawTargetId: string,
): number {
  const targetId =
    targetType === "contentType" ? rawTargetId : normalizeScoringKey(rawTargetId);
  return (
    prefs.find(
      (pref) => pref.targetType === targetType && pref.targetId === targetId,
    )?.score ?? 0
  );
}

export function scoreContent(
  content: ScoreableContent,
  prefs: readonly Affinity[],
  now: number,
  options?: {
    seen?: boolean;
    rng?: () => number;
    interestCategories?: readonly string[];
  },
): number {
  let score = 0;

  score += getAffinityScore(prefs, "category", content.category);
  for (const tag of content.tags) {
    score += getAffinityScore(prefs, "tag", tag);
  }
  score += getAffinityScore(prefs, "contentType", content.kind);

  const interestCategories = options?.interestCategories ?? [];
  if (interestCategories.length > 0) {
    const categoryKey = normalizeScoringKey(content.category);
    if (interestCategories.includes(categoryKey)) {
      score += INTEREST_CATEGORY_BOOST;
    }

    for (const tag of content.tags) {
      if (interestCategories.includes(normalizeScoringKey(tag))) {
        score += INTEREST_TAG_BOOST;
      }
    }
  }

  if (content.publishedAt) {
    const ageMs = now - Date.parse(content.publishedAt);

    if (ageMs < THIRTY_DAYS_MS) {
      score += FRESHNESS_BOOST;
    } else if (ageMs > ONE_EIGHTY_DAYS_MS && !options?.seen) {
      score += ARCHIVE_BOOST;
    }
  }

  if (options?.seen) {
    score -= SEEN_PENALTY;
  }

  const rng = options?.rng ?? Math.random;
  score += rng() * 0.01;

  return score;
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function activeMixPortions(mix: FeedMix): Array<{ reason: FeedReason; portion: number }> {
  const entries: Array<{ reason: FeedReason; portion: number }> = [];

  if (mix.personalized) {
    entries.push({ reason: "personalized", portion: mix.personalized });
  }
  if (mix.archive) {
    entries.push({ reason: "archive", portion: mix.archive });
  }
  if (mix.editorial) {
    entries.push({ reason: "editorial", portion: mix.editorial });
  }
  if (mix.random) {
    entries.push({ reason: "random", portion: mix.random });
  }

  return entries;
}

/**
 * Assigns each scored item to a discovery bucket and returns a mixed feed.
 * Editorial picks follow score order; random picks sample the remainder.
 */
export function bucketFeed<T>(
  scored: readonly ScoredItem<T>[],
  mix: FeedMix,
  rng: () => number = Math.random,
): FeedItem<T>[] {
  if (scored.length === 0) {
    return [];
  }

  const portions = activeMixPortions(mix);
  const totalPortion = portions.reduce((sum, entry) => sum + entry.portion, 0);

  if (totalPortion <= 0) {
    return scored.map((item) => ({ content: item.content, reason: "editorial" }));
  }

  const sorted = [...scored].sort((left, right) => right.score - left.score);
  const remaining = new Set(sorted.map((item) => item.id));
  const buckets: FeedItem<T>[] = [];

  let assigned = 0;

  for (const [index, entry] of portions.entries()) {
    const isLast = index === portions.length - 1;
    const targetCount = isLast
      ? sorted.length - assigned
      : Math.round((sorted.length * entry.portion) / totalPortion);

    if (entry.reason === "editorial" || entry.reason === "personalized" || entry.reason === "archive") {
      const picks = sorted
        .filter((item) => remaining.has(item.id))
        .slice(0, targetCount);

      for (const pick of picks) {
        remaining.delete(pick.id);
        buckets.push({ content: pick.content, reason: entry.reason });
      }

      assigned += picks.length;
      continue;
    }

    const pool = sorted.filter((item) => remaining.has(item.id));
    const picks = shuffleWithRng(pool, rng).slice(0, targetCount);

    for (const pick of picks) {
      remaining.delete(pick.id);
      buckets.push({ content: pick.content, reason: entry.reason });
    }

    assigned += picks.length;
  }

  return shuffleWithRng(buckets, rng);
}
