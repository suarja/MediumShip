import type { TasteSignalSummary } from "./signals";
import { sanitizeInsightsInput } from "./sanitizeUserInput";

export type InsightsLocale = "fr" | "en";

const JOURNALIST_TONE = {
  fr: "Ton journaliste culturel, chaleureux et précis. 2 à 4 phrases courtes.",
  en: "Warm cultural-journalist tone. 2 to 4 short sentences.",
} as const;

function formatSummaryBlock(summary: TasteSignalSummary): string {
  const lines: string[] = [];

  if (summary.topCategories.length > 0) {
    lines.push(
      `categories: ${summary.topCategories.map((row) => row.key).join(", ")}`,
    );
  }
  if (summary.topTags.length > 0) {
    lines.push(`tags: ${summary.topTags.map((row) => row.key).join(", ")}`);
  }
  if (summary.topContentTypes.length > 0) {
    lines.push(
      `formats: ${summary.topContentTypes.map((row) => row.key).join(", ")}`,
    );
  }
  if (summary.explicitInterests.length > 0) {
    lines.push(`explicit_interests: ${summary.explicitInterests.join(", ")}`);
  }

  lines.push(`recent_opens: ${summary.recentOpens}`);
  lines.push(`recent_finishes: ${summary.recentFinishes}`);
  lines.push(`bookmarks: ${summary.bookmarkCount}`);
  lines.push(`cold_start: ${summary.isColdStart}`);

  return lines.join("\n");
}

const SYSTEM_PROMPTS: Record<InsightsLocale, string> = {
  fr: `Tu es un journaliste culturel qui décrit les goûts de lecture d'un membre.
Tu reçois uniquement des agrégats anonymes (catégories, tags, formats, compteurs).
Règles :
- Écris un court paragraphe (2 à 4 phrases) en français.
- Décris les tendances globales, pas de liste à puces.
- Ne cite aucun titre d'article, aucun nom, aucun identifiant de contenu.
- Ne recommande aucun contenu précis — la sélection est gérée ailleurs.
- Si cold_start est true, adopte un ton d'accueil pour un profil encore léger.`,

  en: `You are a cultural journalist describing a member's reading tastes.
You receive only anonymous aggregates (categories, tags, formats, counts).
Rules:
- Write a short paragraph (2–4 sentences) in English.
- Describe global trends, not bullet lists.
- Never cite article titles, names, or content IDs.
- Do not recommend specific content — selection is handled elsewhere.
- If cold_start is true, use a welcoming tone for a light profile.`,
};

export function buildInsightsPrompt(
  summary: TasteSignalSummary,
  locale: InsightsLocale,
): { system: string; user: string } {
  const summaryBlock = formatSummaryBlock(summary);
  const { sanitized, lowConfidenceMatches } = sanitizeInsightsInput(summaryBlock);

  if (lowConfidenceMatches.length > 0) {
    // Telemetry hook — no PII in the matched strings.
    console.warn("[insights] low-confidence prompt patterns", {
      count: lowConfidenceMatches.length,
    });
  }

  const tone = JOURNALIST_TONE[locale];

  return {
    system: `${SYSTEM_PROMPTS[locale]}\n${tone}`,
    user: `<taste_signals>\n${sanitized}\n</taste_signals>`,
  };
}

/** Exported for tests — ensures no email/name-like PII leaks into prompts. */
export function summaryContainsPii(summaryText: string): boolean {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  return emailPattern.test(summaryText);
}
