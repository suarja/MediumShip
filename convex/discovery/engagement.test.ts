/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import {
  ARTICLE_DWELL_SECONDS_PER_MINUTE,
  engagementSignals,
  FINISH_THRESHOLDS,
  hasFinishedArticle,
  hasFinishedMedia,
} from "./engagement";

describe("FINISH_THRESHOLDS", () => {
  it("defines per-ContentKind completion ratios", () => {
    expect(FINISH_THRESHOLDS.episode).toBe(0.9);
    expect(FINISH_THRESHOLDS.video).toBe(0.9);
    expect(FINISH_THRESHOLDS.article).toBe(1);
  });
});

describe("hasFinishedMedia", () => {
  it("returns true when progress ratio meets the kind threshold", () => {
    expect(hasFinishedMedia("episode", { progressRatio: 0.91 })).toBe(true);
    expect(hasFinishedMedia("video", { progressRatio: 0.89 })).toBe(false);
  });
});

describe("hasFinishedArticle", () => {
  it("returns true when scrolled to end", () => {
    expect(
      hasFinishedArticle({ scrolledToEnd: true, dwellSeconds: 0 }),
    ).toBe(true);
  });

  it("returns true when dwell meets estimated read time", () => {
    expect(
      hasFinishedArticle({
        scrolledToEnd: false,
        dwellSeconds: 5 * ARTICLE_DWELL_SECONDS_PER_MINUTE,
        estimatedReadMinutes: 5,
      }),
    ).toBe(true);
  });

  it("returns false when neither condition is met", () => {
    expect(
      hasFinishedArticle({
        scrolledToEnd: false,
        dwellSeconds: 30,
        estimatedReadMinutes: 5,
      }),
    ).toBe(false);
  });
});

describe("engagementSignals", () => {
  it("returns finish when media crosses the threshold", () => {
    expect(
      engagementSignals("episode", { progressRatio: 0.95 }),
    ).toEqual(["finish"]);
  });

  it("returns finish for articles scrolled to end", () => {
    expect(
      engagementSignals("article", { scrolledToEnd: true }),
    ).toEqual(["finish"]);
  });

  it("returns no signals when consumption is incomplete", () => {
    expect(engagementSignals("video", { progressRatio: 0.5 })).toEqual([]);
    expect(engagementSignals("article", { dwellSeconds: 10 })).toEqual([]);
  });

  it("never returns cumulative or duplicate signal types", () => {
    const signals = engagementSignals("episode", { progressRatio: 1 });
    expect(signals).toEqual(["finish"]);
  });
});
