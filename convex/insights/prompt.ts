import type { Doc } from "../_generated/dataModel";
import type { TasteSignalSummary } from "./signals";
import { sanitizeInsightsInput } from "./sanitizeUserInput";

export type InsightsLocale = "fr" | "en";

export type InsightsCandidatePick = {
  slot: number;
  category: string;
  title: string;
  summary: string;
};

export type PreviousAnalysisContext = {
  dayKey: string;
  overview: string;
  reflection?: string;
  trends?: string;
} | null;

function formatSummaryBlock(summary: TasteSignalSummary): string {
  const lines: string[] = [];

  if (summary.topCategories.length > 0) {
    lines.push(
      `categories: ${summary.topCategories.map((row) => `${row.key}(${row.score})`).join(", ")}`,
    );
  }
  if (summary.topTags.length > 0) {
    lines.push(`tags: ${summary.topTags.map((row) => `${row.key}(${row.score})`).join(", ")}`);
  }
  if (summary.topContentTypes.length > 0) {
    lines.push(
      `formats: ${summary.topContentTypes.map((row) => `${row.key}(${row.score})`).join(", ")}`,
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

function formatCandidatesBlock(candidates: readonly InsightsCandidatePick[]): string {
  return candidates
    .map(
      (pick) =>
        `${pick.slot}. [${pick.category}] ${pick.title}\n   ${pick.summary}`,
    )
    .join("\n");
}

function formatPreviousBlock(previous: PreviousAnalysisContext): string {
  if (!previous) {
    return "none";
  }

  const lines = [`day: ${previous.dayKey}`, `overview: ${previous.overview}`];
  if (previous.reflection) {
    lines.push(`reflection: ${previous.reflection}`);
  }
  if (previous.trends) {
    lines.push(`trends: ${previous.trends}`);
  }
  return lines.join("\n");
}

const SYSTEM_PROMPTS: Record<InsightsLocale, string> = {
  fr: `Tu es un journaliste culturel qui rédige un compte rendu premium sur les goûts de lecture d'un membre.
Tu reçois des agrégats anonymes, le contexte de la dernière analyse, et une liste de contenus PRÉ-SÉLECTIONNÉS (numérotés 1..N).
Règles :
- La sortie est structurée (overview, reflection, trends, picks[]) — remplis chaque champ.
- Fournis une entrée picks pour CHAQUE slot fourni (aucun slot manquant).
- Le ton est chaleureux, éditorial, comme un commentaire de rédaction — pas une liste sèche.
- Ne cite aucun email, nom d'utilisateur, ni identifiant technique.
- Si cold_start est true, adopte un ton d'accueil pour un profil encore léger.`,

  en: `You are a cultural journalist writing a premium reading-taste report for a member.
You receive anonymous aggregates, the previous analysis context, and PRE-SELECTED content items (numbered 1..N).
Rules:
- Output is structured (overview, reflection, trends, picks[]) — fill every field.
- Provide a picks entry for EVERY supplied slot (no missing slots).
- Tone: warm editorial commentary — not a dry bullet list.
- Never cite emails, user names, or technical identifiers.
- If cold_start is true, use a welcoming tone for a light profile.`,
};

export function buildInsightsPrompt(
  summary: TasteSignalSummary,
  locale: InsightsLocale,
  candidates: readonly InsightsCandidatePick[],
  previous: PreviousAnalysisContext,
): { system: string; user: string } {
  const summaryBlock = formatSummaryBlock(summary);
  const { sanitized, lowConfidenceMatches } = sanitizeInsightsInput(summaryBlock);

  if (lowConfidenceMatches.length > 0) {
    console.warn("[insights] low-confidence prompt patterns", {
      count: lowConfidenceMatches.length,
    });
  }

  const candidateBlock = formatCandidatesBlock(candidates);
  const { sanitized: sanitizedCandidates } = sanitizeInsightsInput(candidateBlock);
  const previousBlock = formatPreviousBlock(previous);

  return {
    system: SYSTEM_PROMPTS[locale],
    user: [
      "<previous_analysis>",
      previousBlock,
      "</previous_analysis>",
      "",
      "<taste_signals>",
      sanitized,
      "</taste_signals>",
      "",
      "<candidate_picks>",
      sanitizedCandidates,
      "</candidate_picks>",
    ].join("\n"),
  };
}

export function toCandidatePicks(
  contents: readonly Pick<
    Doc<"contents">,
    "_id" | "category" | "title" | "summary"
  >[],
): InsightsCandidatePick[] {
  return contents.map((content, index) => ({
    slot: index + 1,
    category: content.category,
    title: content.title,
    summary: content.summary,
  }));
}

/** Exported for tests — ensures no email/name-like PII leaks into prompts. */
export function summaryContainsPii(summaryText: string): boolean {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  return emailPattern.test(summaryText);
}
