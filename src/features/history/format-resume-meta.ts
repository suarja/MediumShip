import type { TFunction } from "i18next";

import { formatMediaClock } from "../media/format-media-clock";
import type { ContentKind } from "../content/types";

type ResumeMetaInput = {
  kind: ContentKind;
  progressRatio: number;
  seconds: number;
  durationSeconds?: number;
};

export function formatResumeMeta(
  item: ResumeMetaInput,
  t: TFunction<"library">,
): string {
  const kindLabel = t(`kinds.${item.kind}`);
  const percent = Math.round(item.progressRatio * 100);

  if (item.durationSeconds !== undefined && item.durationSeconds > 0) {
    const remainingSeconds = Math.max(0, item.durationSeconds - item.seconds);
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
