import type { InsightsLocale } from "./prompt";

export type InsightsPickSlot = {
  slot: number;
  rationale: string;
};

export type ParsedInsightsReport = {
  overview: string;
  reflection?: string;
  trends?: string;
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

    const overview =
      typeof parsed.overview === "string" ? parsed.overview.trim() : "";
    if (!overview) {
      return null;
    }

    const reflection =
      typeof parsed.reflection === "string" && parsed.reflection.trim().length > 0
        ? parsed.reflection.trim()
        : undefined;
    const trends =
      typeof parsed.trends === "string" && parsed.trends.trim().length > 0
        ? parsed.trends.trim()
        : undefined;

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

    return { overview, reflection, trends, picks };
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
        "Votre profil de lecture se précise jour après jour. Nous observons des affinités nettes dans vos ouvertures récentes.",
      reflection:
        "Depuis la dernière analyse, vous avez surtout exploré des formats longs et des sujets d'actualité.",
      trends:
        "La tendance du moment : plus de profondeur, moins de lecture superficielle.",
      picks: Array.from({ length: pickCount }, (_, index) => ({
        slot: index + 1,
        rationale:
          "Ce contenu prolonge vos lectures récentes tout en élargissant légèrement le champ.",
      })),
    };
  }

  return {
    overview:
      "Your reading profile is sharpening day by day. We see clear affinities in your recent opens.",
    reflection:
      "Since your last analysis, you have mostly explored long-form pieces and current-affairs topics.",
    trends: "The current trend: more depth, less skim-reading.",
    picks: Array.from({ length: pickCount }, (_, index) => ({
      slot: index + 1,
      rationale:
        "This pick extends what you have been reading while nudging your tastes slightly wider.",
    })),
  };
}

export function composePreviewText(report: ParsedInsightsReport): string {
  return [report.overview, report.reflection, report.trends]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(" ")
    .trim();
}
