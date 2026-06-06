import { describe, expect, it } from "vitest";

import {
  bucketFeed,
  createSeededRng,
  normalizeScoringKey,
  type ScoredItem,
} from "./scoring";

describe("normalizeScoringKey", () => {
  it("folds case, trims whitespace, and strips accents", () => {
    expect(normalizeScoringKey("Politique")).toBe("politique");
    expect(normalizeScoringKey("politique")).toBe("politique");
    expect(normalizeScoringKey(" Politique ")).toBe("politique");
    expect(normalizeScoringKey("Démocratie")).toBe("democratie");
  });
});

describe("bucketFeed", () => {
  it("splits editorial and random buckets within tolerance and tags reasons", () => {
    const scored: ScoredItem<{ id: string }>[] = Array.from({ length: 20 }, (_, index) => ({
      id: `item-${index}`,
      content: { id: `item-${index}` },
      score: index,
    }));

    const rng = createSeededRng(42);
    const feed = bucketFeed(scored, { editorial: 0.5, random: 0.5 }, rng);

    expect(feed).toHaveLength(20);

    const editorialCount = feed.filter((item) => item.reason === "editorial").length;
    const randomCount = feed.filter((item) => item.reason === "random").length;

    expect(editorialCount).toBeGreaterThanOrEqual(8);
    expect(editorialCount).toBeLessThanOrEqual(12);
    expect(randomCount).toBeGreaterThanOrEqual(8);
    expect(randomCount).toBeLessThanOrEqual(12);
    expect(editorialCount + randomCount).toBe(20);

    for (const item of feed) {
      expect(item.reason === "editorial" || item.reason === "random").toBe(true);
    }
  });
});
