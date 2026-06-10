import { describe, expect, it } from "vitest";

import {
  buildFallbackReport,
  clampInsightsReport,
  composePreviewText,
  parseInsightsReport,
} from "./reportFormat";

describe("parseInsightsReport", () => {
  it("parses structured JSON with pick rationales", () => {
    const raw = JSON.stringify({
      overview: "Vous lisez beaucoup de politique.",
      reflection: "Depuis la dernière analyse, plus d'épisodes.",
      trends: "Format long en hausse.",
      picks: [
        { slot: 1, rationale: "Pour approfondir vos lectures récentes." },
        { slot: 2, rationale: "Un angle complémentaire sur l'économie." },
      ],
    });

    const parsed = parseInsightsReport(raw, 2);
    expect(parsed?.overview).toContain("politique");
    expect(parsed?.picks).toHaveLength(2);
  });

  it("returns null for empty overview", () => {
    expect(parseInsightsReport('{"overview":""}', 1)).toBeNull();
  });
});

describe("clampInsightsReport", () => {
  it("does not truncate overview — length is enforced upstream in the prompt", () => {
    const longOverview = "Tu lis beaucoup. ".repeat(40).trim();
    const clamped = clampInsightsReport({
      overview: longOverview,
      picks: [{ slot: 1, rationale: "Court." }],
    });

    expect(clamped.overview).toBe(longOverview);
    expect(clamped.overview.endsWith("…")).toBe(false);
  });
});

describe("buildFallbackReport", () => {
  it("builds a preview string", () => {
    const report = buildFallbackReport("fr", 2);
    const preview = composePreviewText(report);
    expect(preview.length).toBeGreaterThan(20);
    expect(report.picks).toHaveLength(2);
  });
});
