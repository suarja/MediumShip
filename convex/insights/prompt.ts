import type { Doc } from "../_generated/dataModel";
import { buildBriefingInstructions } from "./instructions";
import { BRIEFING_PROMPT_TARGETS } from "./reportFormat";
import type { TasteSignalSummary } from "./signals";
import { sanitizeInsightsInput } from "./sanitizeUserInput";

export type InsightsLocale = "fr" | "en";

export type InsightsCandidatePick = {
  slot: number;
  kind: "article" | "episode" | "video";
  source?: string;
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

function humanizeCategoryKey(key: string): string {
  return key.replace(/-/g, " ");
}

function formatSummaryBlock(
  summary: TasteSignalSummary,
  locale: InsightsLocale,
): string {
  if (locale === "fr") {
    const lines: string[] = [];

    if (summary.topCategories.length > 0) {
      const cats = summary.topCategories
        .map((row) => `${humanizeCategoryKey(row.key)} (score ${row.score})`)
        .join(", ");
      lines.push(`Catégories où il/elle lit le plus : ${cats}`);
    }
    if (summary.topTags.length > 0) {
      const tags = summary.topTags
        .map((row) => `${humanizeCategoryKey(row.key)} (${row.score})`)
        .join(", ");
      lines.push(`Tags récurrents : ${tags}`);
    }
    if (summary.topContentTypes.length > 0) {
      const formats = summary.topContentTypes
        .map((row) => {
          const label =
            row.key === "video"
              ? "vidéos"
              : row.key === "episode"
                ? "épisodes"
                : "articles";
          return `${label} (${row.score})`;
        })
        .join(", ");
      lines.push(`Formats préférés : ${formats}`);
    }
    if (summary.explicitInterests.length > 0) {
      lines.push(
        `Centres d'intérêt déclarés : ${summary.explicitInterests.map(humanizeCategoryKey).join(", ")}`,
      );
    }

    lines.push(`Ouvertures récentes : ${summary.recentOpens}`);
    lines.push(`Lectures terminées récemment : ${summary.recentFinishes}`);
    lines.push(`Favoris enregistrés : ${summary.bookmarkCount}`);
    lines.push(
      summary.isColdStart
        ? "Premier briefing — peu d'historique de lecture"
        : "Historique de lecture établi",
    );

    return lines.join("\n");
  }

  const lines: string[] = [];

  if (summary.topCategories.length > 0) {
    const cats = summary.topCategories
      .map((row) => `${humanizeCategoryKey(row.key)} (score ${row.score})`)
      .join(", ");
    lines.push(`Top reading categories: ${cats}`);
  }
  if (summary.topTags.length > 0) {
    const tags = summary.topTags
      .map((row) => `${humanizeCategoryKey(row.key)} (${row.score})`)
      .join(", ");
    lines.push(`Recurring tags: ${tags}`);
  }
  if (summary.topContentTypes.length > 0) {
    const formats = summary.topContentTypes
      .map((row) => `${row.key} (${row.score})`)
      .join(", ");
    lines.push(`Preferred formats: ${formats}`);
  }
  if (summary.explicitInterests.length > 0) {
    lines.push(
      `Declared interests: ${summary.explicitInterests.map(humanizeCategoryKey).join(", ")}`,
    );
  }

  lines.push(`Recent opens: ${summary.recentOpens}`);
  lines.push(`Recent finishes: ${summary.recentFinishes}`);
  lines.push(`Saved bookmarks: ${summary.bookmarkCount}`);
  lines.push(
    summary.isColdStart
      ? "First briefing — limited reading history"
      : "Established reading history",
  );

  return lines.join("\n");
}

function formatCandidatesBlock(
  candidates: readonly InsightsCandidatePick[],
  locale: InsightsLocale,
): string {
  return candidates
    .map((pick) => {
      const formatLabel = pick.source ? `${pick.kind}/${pick.source}` : pick.kind;
      const header = `Slot ${pick.slot} — ${formatLabel} · ${pick.category}`;
      if (locale === "fr") {
        return `${header}\nTitre : ${pick.title}\nRésumé : ${pick.summary}`;
      }
      return `${header}\nTitle: ${pick.title}\nSummary: ${pick.summary}`;
    })
    .join("\n\n");
}

function formatPreviousBlock(
  previous: PreviousAnalysisContext,
  locale: InsightsLocale,
): string {
  if (!previous) {
    return locale === "fr" ? "Aucun briefing précédent." : "No previous briefing.";
  }

  const dateLabel =
    locale === "fr"
      ? `Briefing du ${previous.dayKey}`
      : `Briefing for ${previous.dayKey}`;

  const lines = [dateLabel, `Overview : ${previous.overview}`];
  if (previous.reflection) {
    lines.push(`Reflection : ${previous.reflection}`);
  }
  if (previous.trends) {
    lines.push(`Trends : ${previous.trends}`);
  }
  return lines.join("\n");
}

function buildTaskBlock(locale: InsightsLocale): string {
  const overviewTarget = BRIEFING_PROMPT_TARGETS.overviewChars;
  const rationaleTarget = BRIEFING_PROMPT_TARGETS.pickRationaleChars;

  if (locale === "fr") {
    return `---

Rédige le briefing JSON pour CE lecteur.

Rappels impératifs :
- Tutoiement partout.
- overview : un seul bloc de 3–4 phrases complètes — habitudes récentes + évolution (si <previous_analysis> existe) + tendance format/thème, tout fondu. Jamais de rubrique « depuis le dernier… » ni d'excuse sur le manque de données.
- picks : une entrée par slot dans <candidate_picks> ; rationale en 1 phrase « tu », format ou titre cité.

## LONGUEUR (impératif — phrase toujours terminée)
- \`overview\` : vise ~${overviewTarget} caractères (≈3–4 phrases). Si tu approches la limite, conclus par une phrase courte plutôt que d'être coupé en plein mot.
- \`picks[].rationale\` : vise ~${rationaleTarget} caractères, une phrase complète.`;
  }

  return `---

Write the JSON briefing for THIS reader.

Hard reminders:
- Second person ("you") throughout.
- overview: one block of 3–4 complete sentences — recent habits + what shifted (if <previous_analysis> exists) + format/theme tendency, all woven together. Never a "since your last briefing" heading or apologies about missing data.
- picks: one entry per slot in <candidate_picks>; 1-sentence "you" rationale citing format or title.

## LENGTH (mandatory — always finish the sentence)
- \`overview\`: target ~${overviewTarget} characters (~3–4 sentences). If nearing the limit, close with a short complete sentence rather than stopping mid-word.
- \`picks[].rationale\`: target ~${rationaleTarget} characters, one complete sentence.`;
}

export function buildInsightsPrompt(
  summary: TasteSignalSummary,
  locale: InsightsLocale,
  candidates: readonly InsightsCandidatePick[],
  previous: PreviousAnalysisContext,
): { system: string; user: string } {
  const summaryBlock = formatSummaryBlock(summary, locale);
  const { sanitized, lowConfidenceMatches } = sanitizeInsightsInput(summaryBlock);

  if (lowConfidenceMatches.length > 0) {
    console.warn("[insights] low-confidence prompt patterns", {
      count: lowConfidenceMatches.length,
    });
  }

  const candidateBlock = formatCandidatesBlock(candidates, locale);
  const { sanitized: sanitizedCandidates } = sanitizeInsightsInput(candidateBlock);
  const previousBlock = formatPreviousBlock(previous, locale);

  return {
    system: buildBriefingInstructions(locale, {
      isColdStart: summary.isColdStart,
    }),
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
      "",
      buildTaskBlock(locale),
    ].join("\n"),
  };
}

export function toCandidatePicks(
  contents: readonly Pick<
    Doc<"contents">,
    "_id" | "kind" | "source" | "category" | "title" | "summary"
  >[],
): InsightsCandidatePick[] {
  return contents.map((content, index) => ({
    slot: index + 1,
    kind: content.kind,
    source: content.source,
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
