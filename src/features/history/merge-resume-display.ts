import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";
import {
  type PlaybackProgressSnapshot,
  resolveProgressDuration,
} from "../media/playback-progress";

export type ResumeQueryItem = NonNullable<
  FunctionReturnType<typeof api.readingHistory.queries.getResume>
>;

export function mergeResumeWithLocalSnapshot(
  resume: ResumeQueryItem,
  localSnapshot: PlaybackProgressSnapshot | null,
): ResumeQueryItem {
  const seconds = Math.max(resume.seconds, localSnapshot?.seconds ?? 0);
  const observedDuration =
    Math.max(
      resume.observedDurationSeconds ?? 0,
      localSnapshot?.durationSeconds ?? 0,
    ) || undefined;
  let durationSeconds = resolveProgressDuration(
    seconds,
    observedDuration,
    resume.catalogDurationSeconds,
  );
  if (durationSeconds === undefined && resume.durationSeconds !== undefined) {
    durationSeconds = resume.durationSeconds;
  }
  const progressRatio =
    durationSeconds !== undefined && durationSeconds > 0
      ? Math.min(1, Math.max(0, seconds / durationSeconds))
      : resume.progressRatio;

  return {
    ...resume,
    seconds,
    observedDurationSeconds: observedDuration,
    durationSeconds,
    progressRatio,
  };
}
