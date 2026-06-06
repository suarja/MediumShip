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
