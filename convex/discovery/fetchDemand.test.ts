import { describe, expect, it } from "vitest";

import {
  aggregateInterestCategories,
  computeFetchDemand,
  mergeCategoryAffinities,
  SCHEDULED_INGESTION_DEMAND_OPTIONS,
} from "./fetchDemand";

describe("computeFetchDemand", () => {
  it("returns tenant seed categories on cold start with no affinities", () => {
    const demand = computeFetchDemand([], ["Science", "History", "Culture"], {
      maxCategories: 3,
    });

    expect(demand.categories).toEqual(["science", "history", "culture"]);
    expect(demand.coldStart).toBe(true);
  });

  it("ranks top categories by aggregate score", () => {
    const demand = computeFetchDemand(
      [
        { targetId: "science", score: 120 },
        { targetId: "history", score: 80 },
        { targetId: "culture", score: 40 },
      ],
      ["economy"],
      { maxCategories: 2, diversitySlots: 0 },
    );

    expect(demand.categories).toEqual(["science", "history"]);
  });

  it("normalizes affinity keys via normalizeScoringKey", () => {
    const demand = computeFetchDemand(
      [{ targetId: "Sciences Sociales", score: 50 }],
      [],
      { maxCategories: 1, diversitySlots: 0 },
    );

    expect(demand.categories).toEqual(["sciences-sociales"]);
  });

  it("adds diversity quota from seed categories outside the top", () => {
    const demand = computeFetchDemand(
      [
        { targetId: "science", score: 200 },
        { targetId: "history", score: 150 },
        { targetId: "culture", score: 100 },
      ],
      ["economy", "politics"],
      { maxCategories: 4, diversitySlots: 2 },
    );

    expect(demand.categories).toHaveLength(4);
    expect(demand.categories.slice(0, 2)).toEqual(["science", "history"]);
    expect(demand.categories).toContain("economy");
    expect(demand.categories).toContain("politics");
  });

  it("bounds the number of returned categories", () => {
    const demand = computeFetchDemand(
      [
        { targetId: "a", score: 10 },
        { targetId: "b", score: 9 },
        { targetId: "c", score: 8 },
        { targetId: "d", score: 7 },
        { targetId: "e", score: 6 },
      ],
      ["f", "g", "h"],
      { maxCategories: 3, diversitySlots: 1 },
    );

    expect(demand.categories).toHaveLength(3);
  });

  it("honors scheduled ingestion limits for deeper cron batches", () => {
    const demand = computeFetchDemand(
      [
        { targetId: "science", score: 200 },
        { targetId: "history", score: 180 },
        { targetId: "culture", score: 160 },
        { targetId: "politics", score: 140 },
        { targetId: "economy", score: 120 },
        { targetId: "technology", score: 100 },
      ],
      ["sports", "music", "art"],
      SCHEDULED_INGESTION_DEMAND_OPTIONS,
    );

    expect(demand.categories).toHaveLength(8);
    expect(demand.categories).toContain("science");
    expect(demand.categories).toContain("sports");
  });

  it("folds picked interest categories into demand alongside affinities", () => {
    const affinities = mergeCategoryAffinities(
      [{ targetId: "history", score: 80 }],
      aggregateInterestCategories([{ categoryKey: "science" }]),
    );

    const demand = computeFetchDemand(affinities, ["economy"], {
      maxCategories: 3,
      diversitySlots: 1,
    });

    expect(demand.categories).toContain("science");
    expect(demand.categories).toContain("history");
    expect(demand.categories.length).toBeLessThanOrEqual(3);
  });
});
