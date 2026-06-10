// Mirrors `src/features/media/playback-progress.ts` — kept in Convex so resume
// queries share the same "non terminé" rule as the mobile players.

export const MIN_RESUMABLE_SECONDS = 5;
export const END_THRESHOLD_SECONDS = 15;

/** True when saved seconds represent an in-progress media item worth resuming. */
export function isResumableProgress(
  seconds: number,
  durationSeconds: number | undefined,
): boolean {
  if (seconds < MIN_RESUMABLE_SECONDS) {
    return false;
  }
  if (
    durationSeconds !== undefined &&
    durationSeconds > 0 &&
    seconds >= durationSeconds - END_THRESHOLD_SECONDS
  ) {
    return false;
  }
  return true;
}

export function progressRatioFromSeconds(
  seconds: number,
  durationSeconds: number | undefined,
): number | undefined {
  if (durationSeconds === undefined || durationSeconds <= 0) {
    return undefined;
  }
  return Math.min(1, Math.max(0, seconds / durationSeconds));
}
