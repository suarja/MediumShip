import type { InsightsLocale } from "./prompt";

export type InsightsPickSlot = {
  slot: number;
  rationale: string;
};

export type ParsedInsightsReport = {
  overview: string;
  picks: InsightsPickSlot[];
};

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/i;

function stripCodeFence(raw: string): string {
  const fenced = raw.match(JSON_BLOCK_RE);
  return (fenced?.[1] ?? raw).trim();
}

export function parseInsightsReport(
  raw: string,
  pickCount: number,
): ParsedInsightsReport | null {
  const trimmed = stripCodeFence(raw);
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      overview?: unknown;
      reflection?: unknown;
      trends?: unknown;
      picks?: unknown;
    };

    let overview =
      typeof parsed.overview === "string" ? parsed.overview.trim() : "";
    if (!overview) {
      return null;
    }

    const legacyReflection =
      typeof parsed.reflection === "string" ? parsed.reflection.trim() : "";
    const legacyTrends =
      typeof parsed.trends === "string" ? parsed.trends.trim() : "";
    if (legacyReflection || legacyTrends) {
      overview = [overview, legacyReflection, legacyTrends]
        .filter((part) => part.length > 0)
        .join(" ");
    }

    const picks: InsightsPickSlot[] = [];
    if (Array.isArray(parsed.picks)) {
      for (const entry of parsed.picks) {
        if (
          entry &&
          typeof entry === "object" &&
          typeof (entry as { slot?: unknown }).slot === "number" &&
          typeof (entry as { rationale?: unknown }).rationale === "string"
        ) {
          const slot = (entry as { slot: number }).slot;
          const rationale = (entry as { rationale: string }).rationale.trim();
          if (slot >= 1 && slot <= pickCount && rationale.length > 0) {
            picks.push({ slot, rationale });
          }
        }
      }
    }

    picks.sort((left, right) => left.slot - right.slot);

    return { overview, picks };
  } catch {
    return null;
  }
}

export function buildFallbackReport(
  locale: InsightsLocale,
  pickCount: number,
): ParsedInsightsReport {
  if (locale === "fr") {
    return {
      overview:
        "Tu ouvres souvent des sujets d'actualité en ce moment, surtout en article. Quand un thème t'accroche, tu passes aux formats plus longs — on part de là pour affiner tes prochaines lectures.",
      picks: Array.from({ length: pickCount }, (_, index) => ({
        slot: index + 1,
        rationale:
          "Ce format te correspond — il prolonge ce que tu as ouvert récemment sans tourner en rond.",
      })),
    };
  }

  return {
    overview:
      "You've been opening a lot of current-affairs pieces lately — mostly articles. When a topic hooks you, you reach for longer formats; we'll build on that rhythm for what comes next.",
    picks: Array.from({ length: pickCount }, (_, index) => ({
      slot: index + 1,
      rationale:
        "This format fits you — it builds on what you've opened recently without repeating the same angle.",
    })),
  };
}

export function composePreviewText(report: ParsedInsightsReport): string {
  return report.overview.trim();
}

const SENTENCE_END_RE = /[.!?…](?:\s|$)/;

/** Hard cap for briefing prose — trims at sentence boundary when possible. */
export function truncateBriefingProse(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxChars);
  const lastSentence = slice.search(SENTENCE_END_RE);
  if (lastSentence > maxChars * 0.4) {
    return slice.slice(0, lastSentence + 1).trim();
  }

  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}

/** Prompt-facing targets — the model self-limits; never hard-truncate overview after generation. */
export const BRIEFING_PROMPT_TARGETS = {
  overviewChars: 480,
  pickRationaleChars: 180,
} as const;

/** JSON-schema safety caps (~20% above prompt targets, Editia pattern). */
export const BRIEFING_SCHEMA_MAX = {
  overview: 720,
  pickRationale: 220,
} as const;

export function clampInsightsReport(report: ParsedInsightsReport): ParsedInsightsReport {
  return {
    overview: report.overview.trim(),
    picks: report.picks.map((pick) => ({
      slot: pick.slot,
      rationale: truncateBriefingProse(
        pick.rationale,
        BRIEFING_SCHEMA_MAX.pickRationale,
      ),
    })),
  };
}
