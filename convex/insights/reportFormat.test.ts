import { describe, expect, it } from "vitest";

import {
  buildFallbackReport,
  clampInsightsReport,
  composePreviewText,
  parseInsightsReport,
  repairOverview,
  truncateBriefingProse,
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

describe("truncateBriefingProse", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncateBriefingProse("Bonjour.", 100)).toBe("Bonjour.");
  });

  it("falls back to last complete sentence when truncated", () => {
    const text = "Première phrase complète. Deuxième phrase qui ne rentre pas dans la limite imposée.";
    const result = truncateBriefingProse(text, 40);
    expect(result).toBe("Première phrase complète.");
  });

  it("uses last word + period when no terminal punctuation in window", () => {
    const text = "Un très long texte sans aucune ponctuation terminale nulle part vraiment";
    const result = truncateBriefingProse(text, 30);
    expect(result.endsWith(".")).toBe(true);
    expect(result).not.toMatch(/\.\.\./);
    expect(result.length).toBeLessThanOrEqual(31); // word + period
  });

  it("never emits a mid-word cut — cuts at last space before adding period", () => {
    // No terminal punctuation within the 25-char window → should end at word boundary + "."
    const text = "abcdefghij klmnopqrstu vwxy";
    const result = truncateBriefingProse(text, 16);
    // "abcdefghij klmno" is the 16-char slice — no terminal punct → last space at index 10
    // Should return "abcdefghij." — complete word before the space
    expect(result).toBe("abcdefghij.");
  });
});

describe("repairOverview", () => {
  it("returns text unchanged when ending with terminal punctuation", () => {
    expect(repairOverview("Tu lis beaucoup.")).toBe("Tu lis beaucoup.");
    expect(repairOverview("Vraiment !")).toBe("Vraiment !");
  });

  it("removes trailing dangling sentence when overview ends mid-sentence", () => {
    const text = "Tu ouvres souvent des articles. Cette tendance qui se";
    expect(repairOverview(text)).toBe("Tu ouvres souvent des articles.");
  });

  it("handles overview ending with ellipsis-style truncation", () => {
    const text = "Tu explores en largeur. Les épisodes t'accrochent surtout. Un thème qui se";
    expect(repairOverview(text)).toBe(
      "Tu explores en largeur. Les épisodes t'accrochent surtout.",
    );
  });

  it("returns text as-is when no terminal punctuation exists at all", () => {
    expect(repairOverview("Bonjour")).toBe("Bonjour");
  });
});

describe("clampInsightsReport", () => {
  it("preserves well-formed overview as-is", () => {
    const overview = "Tu lis beaucoup. ".repeat(5).trim();
    const clamped = clampInsightsReport({
      overview,
      picks: [{ slot: 1, rationale: "Court." }],
    });
    expect(clamped.overview).toBe(overview);
  });

  it("repairs overview that ends mid-sentence", () => {
    const overview = "Tu ouvres souvent des articles. Une tendance qui se";
    const clamped = clampInsightsReport({
      overview,
      picks: [{ slot: 1, rationale: "Court." }],
    });
    expect(clamped.overview).toBe("Tu ouvres souvent des articles.");
  });

  it("truncates pick rationale at sentence boundary", () => {
    const longRationale =
      "Ce contenu prolonge tes habitudes. " +
      "Un angle complémentaire qui va vraiment bien avec ce que tu as ouvert cette semaine vraiment.";
    const clamped = clampInsightsReport({
      overview: "Vue d'ensemble.",
      picks: [{ slot: 1, rationale: longRationale }],
    });
    expect(clamped.picks[0]?.rationale.endsWith(".")).toBe(true);
    expect(clamped.picks[0]?.rationale.length).toBeLessThanOrEqual(220);
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
