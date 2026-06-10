import AsyncStorage from "@react-native-async-storage/async-storage";

// Local, guest-first persistence of audio listening position so an episode
// resumes where the listener left off — even across app restarts. Member
// cross-device sync (Convex) can layer on top later.

const STORAGE_PREFIX = "mediumship:progress:";

// Below this we treat playback as "just started" and do not resume/save.
export const MIN_RESUMABLE_SECONDS = 5;
// Within this window of the end we consider the episode finished and clear it.
export const END_THRESHOLD_SECONDS = 15;
// Only persist once the position has moved at least this much since the last
// write — throttles AsyncStorage churn during continuous playback.
export const SAVE_INTERVAL_SECONDS = 5;
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

export type PlaybackProgressSnapshot = {
  seconds: number;
  durationSeconds?: number;
};

function keyFor(contentId: string): string {
  return `${STORAGE_PREFIX}${contentId}`;
}

function parseStoredProgress(raw: string): PlaybackProgressSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as PlaybackProgressSnapshot;
    if (
      parsed &&
      typeof parsed.seconds === "number" &&
      Number.isFinite(parsed.seconds)
    ) {
      return parsed;
    }
  } catch {
    // Legacy plain-number payloads fall through below.
  }

  const seconds = Number(raw);
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return { seconds };
}

export async function loadPlaybackProgressSnapshot(
  contentId: string,
): Promise<PlaybackProgressSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(contentId));
    if (raw === null) {
      return null;
    }

    const snapshot = parseStoredProgress(raw);
    if (
      snapshot === null ||
      snapshot.seconds < MIN_RESUMABLE_SECONDS
    ) {
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
}

export async function loadPlaybackProgress(
  contentId: string,
): Promise<number | null> {
  const snapshot = await loadPlaybackProgressSnapshot(contentId);
  return snapshot?.seconds ?? null;
}

export async function savePlaybackProgress(
  contentId: string,
  seconds: number,
  durationSeconds?: number,
  durationFromPlayer = false,
): Promise<void> {
  try {
    const existing = await loadPlaybackProgressSnapshot(contentId);
    const flooredSeconds = Math.floor(seconds);
    const nextDuration = mergeStoredPlaybackDuration(
      existing?.durationSeconds,
      durationSeconds,
      durationFromPlayer,
    );

    const payload: PlaybackProgressSnapshot = {
      seconds: flooredSeconds,
      ...(nextDuration !== undefined && nextDuration > 0
        ? { durationSeconds: nextDuration }
        : {}),
    };
    await AsyncStorage.setItem(keyFor(contentId), JSON.stringify(payload));
  } catch {
    // Progress saving is best-effort; never block playback on storage errors.
  }
}

/**
 * Mirrors `convex/playbackProgress/resume.ts` — prefers player-measured duration.
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

export async function clearPlaybackProgress(contentId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(contentId));
  } catch {
    // best-effort
  }
}

export function resolvePreferredProgress(
  localSeconds: number | null,
  remoteSeconds: number | null,
): number | null {
  const candidates = [localSeconds, remoteSeconds].filter(
    (value): value is number => Number.isFinite(value) && value !== null,
  );

  if (candidates.length === 0) {
    return null;
  }

  return Math.max(...candidates);
}

/**
 * Resolve the position to resume at, or null to start from the beginning.
 * Returns null when there is no saved progress, it is too early, or it is
 * within the end window of a known duration.
 */
export function resolveResumeTarget(
  savedSeconds: number | null,
  durationSeconds: number | undefined,
): number | null {
  if (savedSeconds === null || savedSeconds < MIN_RESUMABLE_SECONDS) {
    return null;
  }
  if (durationSeconds !== undefined && durationSeconds > 0) {
    if (savedSeconds > durationSeconds) {
      return savedSeconds;
    }
    if (savedSeconds >= durationSeconds - END_THRESHOLD_SECONDS) {
      return null;
    }
  }
  return savedSeconds;
}

export type ProgressAction =
  | { type: "clear" }
  | { type: "save"; seconds: number }
  | { type: "none" };

/**
 * Pure decision for what to do with playback progress on each tick — shared by
 * audio and hosted-video so both media types resume identically.
 *
 * - Near the end (within END_THRESHOLD of a known duration) → clear, so a
 *   finished item starts over next time.
 * - Past the resumable floor and far enough from the last write → save.
 * - Otherwise → nothing.
 */
export function resolveProgressAction(args: {
  currentSeconds: number;
  durationSeconds: number;
  lastSavedSeconds: number;
}): ProgressAction {
  const { currentSeconds, durationSeconds, lastSavedSeconds } = args;

  if (
    durationSeconds > 0 &&
    currentSeconds <= durationSeconds &&
    currentSeconds >= durationSeconds - END_THRESHOLD_SECONDS
  ) {
    return { type: "clear" };
  }

  if (
    currentSeconds >= MIN_RESUMABLE_SECONDS &&
    Math.abs(currentSeconds - lastSavedSeconds) >= SAVE_INTERVAL_SECONDS
  ) {
    return { type: "save", seconds: currentSeconds };
  }

  return { type: "none" };
}
