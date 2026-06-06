import { describe, expect, it } from "vitest";

import {
  applyInteraction,
  bucketFeed,
  createSeededRng,
  normalizeScoringKey,
  projectAffinities,
  scoreContent,
  type Affinity,
  type ProjectableSignal,
  type ScoredItem,
} from "./scoring";

describe("projectAffinities", () => {
  const like = (contentId: string, category: string): ProjectableSignal => ({
    contentId,
    type: "like",
    category,
    tags: [],
    kind: "article",
  });

  it("counts each (content, type) pair at most once — repeats never stack", () => {
    const single = projectAffinities([like("c1", "Débat")]);
    const repeated = projectAffinities([
      like("c1", "Débat"),
      like("c1", "Débat"),
      like("c1", "Débat"),
    ]);

    expect(single).toEqual(repeated);
    expect(
      repeated.find((a) => a.targetType === "category" && a.targetId === "debat")
        ?.score,
    ).toBe(50);
  });

  it("is idempotent: projecting the same set twice yields the same profile", () => {
    const set = [like("c1", "Débat"), like("c2", "Économie")];
    expect(projectAffinities(set)).toEqual(projectAffinities([...set, ...set]));
  });

  it("drops a dimension once its only contributor leaves the set (toggle off)", () => {
    expect(projectAffinities([])).toEqual([]);
  });
});

describe("normalizeScoringKey", () => {
  it("folds case, trims whitespace, and strips accents", () => {
    expect(normalizeScoringKey("Politique")).toBe("politique");
    expect(normalizeScoringKey("politique")).toBe("politique");
    expect(normalizeScoringKey(" Politique ")).toBe("politique");
    expect(normalizeScoringKey("Démocratie")).toBe("democratie");
  });
});

describe("applyInteraction", () => {
  const emptyPrefs: Affinity[] = [];

  it("raises category and tag affinities on like", () => {
    const updated = applyInteraction(emptyPrefs, {
      type: "like",
      category: "Politique",
      tags: ["Démocratie"],
      kind: "article",
    });

    const category = updated.find(
      (pref) => pref.targetType === "category" && pref.targetId === "politique",
    );
    const tag = updated.find(
      (pref) => pref.targetType === "tag" && pref.targetId === "democratie",
    );
    const contentType = updated.find(
      (pref) => pref.targetType === "contentType" && pref.targetId === "article",
    );

    expect(category?.score).toBe(50);
    expect(tag?.score).toBe(25);
    expect(contentType?.score).toBe(10);
  });

  it("lowers affinities on skip", () => {
    const updated = applyInteraction(emptyPrefs, {
      type: "skip",
      category: "Politique",
      tags: ["Démocratie"],
      kind: "article",
    });

    const category = updated.find(
      (pref) => pref.targetType === "category" && pref.targetId === "politique",
    );

    expect(category?.score).toBe(-10);
  });

  it("applies a large negative on hide", () => {
    const updated = applyInteraction(emptyPrefs, {
      type: "hide",
      category: "Politique",
      tags: [],
      kind: "article",
    });

    const category = updated.find(
      (pref) => pref.targetType === "category" && pref.targetId === "politique",
    );

    expect(category?.score).toBe(-100);
  });

  it("clamps affinity scores to [-500, 1000]", () => {
    const highPrefs: Affinity[] = [
      { targetType: "category", targetId: "politique", score: 980 },
    ];

    const raised = applyInteraction(highPrefs, {
      type: "like",
      category: "Politique",
      tags: [],
      kind: "article",
    });

    expect(
      raised.find((pref) => pref.targetType === "category")?.score,
    ).toBe(1000);

    const lowPrefs: Affinity[] = [
      { targetType: "category", targetId: "politique", score: -490 },
    ];

    const lowered = applyInteraction(lowPrefs, {
      type: "hide",
      category: "Politique",
      tags: [],
      kind: "article",
    });

    expect(
      lowered.find((pref) => pref.targetType === "category")?.score,
    ).toBe(-500);
  });
});

describe("scoreContent", () => {
  const now = Date.parse("2026-06-06T12:00:00.000Z");

  it("ranks category-matching content above unmatched content", () => {
    const prefs: Affinity[] = [
      { targetType: "category", targetId: "politique", score: 100 },
    ];

    const matched = scoreContent(
      {
        category: "Politique",
        tags: [],
        kind: "article",
        publishedAt: "2026-05-01T08:00:00.000Z",
      },
      prefs,
      now,
      { rng: () => 0 },
    );

    const unmatched = scoreContent(
      {
        category: "Culture",
        tags: [],
        kind: "article",
        publishedAt: "2026-05-01T08:00:00.000Z",
      },
      prefs,
      now,
      { rng: () => 0 },
    );

    expect(matched).toBeGreaterThan(unmatched);
  });

  it("adds a freshness boost for content published within 30 days", () => {
    const fresh = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2026-06-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0 },
    );

    const older = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2026-04-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0 },
    );

    expect(fresh - older).toBe(30);
  });

  it("adds an archive boost for unseen content older than 180 days", () => {
    const archive = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2025-11-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0, seen: false },
    );

    const baseline = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2026-04-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0, seen: false },
    );

    expect(archive - baseline).toBe(15);
  });

  it("applies a seen penalty when the content was opened or finished", () => {
    const unseen = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2026-04-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0, seen: false },
    );

    const seen = scoreContent(
      {
        category: "Analyse",
        tags: [],
        kind: "article",
        publishedAt: "2026-04-01T08:00:00.000Z",
      },
      [],
      now,
      { rng: () => 0, seen: true },
    );

    expect(unseen - seen).toBe(30);
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

  it("respects the full 60/20/10/10 mix within tolerance on a seeded corpus", () => {
    const scored: ScoredItem<{ id: string }>[] = Array.from({ length: 40 }, (_, index) => ({
      id: `item-${index}`,
      content: { id: `item-${index}` },
      score: index,
    }));

    const rng = createSeededRng(7);
    const feed = bucketFeed(
      scored,
      { personalized: 0.6, archive: 0.2, editorial: 0.1, random: 0.1 },
      rng,
    );

    expect(feed).toHaveLength(40);

    const counts = {
      personalized: feed.filter((item) => item.reason === "personalized").length,
      archive: feed.filter((item) => item.reason === "archive").length,
      editorial: feed.filter((item) => item.reason === "editorial").length,
      random: feed.filter((item) => item.reason === "random").length,
    };

    expect(counts.personalized).toBeGreaterThanOrEqual(22);
    expect(counts.personalized).toBeLessThanOrEqual(26);
    expect(counts.archive).toBeGreaterThanOrEqual(6);
    expect(counts.archive).toBeLessThanOrEqual(10);
    expect(counts.editorial).toBeGreaterThanOrEqual(2);
    expect(counts.editorial).toBeLessThanOrEqual(6);
    expect(counts.random).toBeGreaterThanOrEqual(2);
    expect(counts.random).toBeLessThanOrEqual(6);
  });
});
