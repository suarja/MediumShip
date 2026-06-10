import type { TFunction } from "i18next";

import { formatMediaClock } from "../media/format-media-clock";
import type { ContentKind } from "../content/types";

type ResumeMetaInput = {
  kind: ContentKind;
  progressRatio: number;
  seconds: number;
  durationSeconds?: number;
};

export function resolveResumeDisplayProgress(item: ResumeMetaInput): {
  percent: number;
  remainingSeconds: number | null;
} {
  const elapsedSeconds = Math.max(0, Math.floor(item.seconds));
  const durationSeconds = Math.floor(item.durationSeconds ?? 0);

  if (durationSeconds > 0) {
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
    return {
      percent: Math.min(100, Math.floor((elapsedSeconds / durationSeconds) * 100)),
      remainingSeconds,
    };
  }

  return {
    percent: Math.min(100, Math.max(0, Math.round(item.progressRatio * 100))),
    remainingSeconds: null,
  };
}

export function formatResumeMeta(
  item: ResumeMetaInput,
  t: TFunction<"library">,
): string {
  const kindLabel = t(`kinds.${item.kind}`);
  const { percent, remainingSeconds } = resolveResumeDisplayProgress(item);

  if (remainingSeconds !== null) {
    return t("screen.resumeMetaWithRemaining", {
      kind: kindLabel,
      remaining: formatMediaClock(remainingSeconds),
      percent,
    });
  }

  return t("screen.resumeMetaPercentOnly", {
    kind: kindLabel,
    percent,
  });
}
