import type { InteractionType } from "./scoring";

export type ContentKind = "article" | "episode" | "video";

export type ConsumptionSnapshot = {
  progressRatio?: number;
  scrolledToEnd?: boolean;
  dwellSeconds?: number;
  estimatedReadMinutes?: number;
};

export const FINISH_THRESHOLDS: Record<ContentKind, number> = {
  article: 1,
  episode: 0.9,
  video: 0.9,
};

/** Seconds of dwell per estimated reading minute for article completion. */
export const ARTICLE_DWELL_SECONDS_PER_MINUTE = 60;

export function hasFinishedMedia(
  kind: "episode" | "video",
  consumption: ConsumptionSnapshot,
): boolean {
  const ratio = consumption.progressRatio ?? 0;
  return ratio >= FINISH_THRESHOLDS[kind];
}

export function hasFinishedArticle(consumption: ConsumptionSnapshot): boolean {
  if (consumption.scrolledToEnd) {
    return true;
  }

  const estimatedMinutes = consumption.estimatedReadMinutes;
  if (
    estimatedMinutes !== undefined &&
    estimatedMinutes > 0 &&
    (consumption.dwellSeconds ?? 0) >=
      estimatedMinutes * ARTICLE_DWELL_SECONDS_PER_MINUTE
  ) {
    return true;
  }

  return false;
}

/** Maps consumption progress to discrete one-shot interaction types (never cumulative). */
export function engagementSignals(
  kind: ContentKind,
  consumption: ConsumptionSnapshot,
): InteractionType[] {
  if (kind === "article") {
    return hasFinishedArticle(consumption) ? ["finish"] : [];
  }

  return hasFinishedMedia(kind, consumption) ? ["finish"] : [];
}
