// Mirrors `src/features/media/playback-progress.ts` — kept in Convex so resume
// queries share the same "non terminé" rule as the mobile players.

export const MIN_RESUMABLE_SECONDS = 5;
export const END_THRESHOLD_SECONDS = 15;
/** Observed duration above catalog by more than this factor is treated as stale CMS. */
export const OBSERVED_INFLATION_THRESHOLD = 1.1;

export function mergeStoredPlaybackDuration(
  existing: number | undefined,
  incoming: number | undefined,
  fromPlayer: boolean,
): number | undefined {
  if (incoming === undefined || incoming <= 0) {
    return existing;
  }

  const next = Math.floor(incoming);
  if (fromPlayer) {
    return next;
  }

  return existing !== undefined && existing > 0
    ? Math.max(existing, next)
    : next;
}

/** True when saved seconds represent an in-progress media item worth resuming. */
export function isResumableProgress(
  seconds: number,
  observedDurationSeconds: number | undefined,
  catalogDurationSeconds?: number | undefined,
): boolean {
  if (seconds < MIN_RESUMABLE_SECONDS) {
    return false;
  }
  const duration = resolveProgressDuration(
    seconds,
    observedDurationSeconds,
    catalogDurationSeconds,
  );
  if (duration === undefined || duration <= 0) {
    return true;
  }
  if (seconds >= duration - END_THRESHOLD_SECONDS) {
    return false;
  }
  return true;
}

/**
 * Best duration for ratio / remaining-time display.
 * Prefers the player-measured length over stale CMS metadata.
 */
export function resolveProgressDuration(
  seconds: number,
  observedDurationSeconds: number | undefined,
  catalogDurationSeconds: number | undefined,
): number | undefined {
  const observed =
    observedDurationSeconds !== undefined && observedDurationSeconds > 0
      ? observedDurationSeconds
      : undefined;
  const catalog =
    catalogDurationSeconds !== undefined && catalogDurationSeconds > 0
      ? catalogDurationSeconds
      : undefined;

  if (observed !== undefined && catalog !== undefined) {
    if (seconds > catalog) {
      return Math.max(observed, seconds);
    }
    if (observed > catalog * OBSERVED_INFLATION_THRESHOLD) {
      return Math.max(catalog, seconds);
    }
    return Math.max(Math.min(observed, catalog), seconds);
  }

  if (observed !== undefined) {
    return Math.max(observed, seconds);
  }

  if (catalog !== undefined) {
    return Math.max(catalog, seconds);
  }

  return undefined;
}

export function progressRatioFromSeconds(
  seconds: number,
  observedDurationSeconds: number | undefined,
  catalogDurationSeconds?: number | undefined,
): number | undefined {
  const duration = resolveProgressDuration(
    seconds,
    observedDurationSeconds,
    catalogDurationSeconds,
  );
  if (duration === undefined || duration <= 0) {
    return undefined;
  }
  return Math.min(1, Math.max(0, seconds / duration));
}
