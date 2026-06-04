import AsyncStorage from "@react-native-async-storage/async-storage";

// Local, guest-first persistence of audio listening position so an episode
// resumes where the listener left off — even across app restarts. Member
// cross-device sync (Convex) can layer on top later.

const STORAGE_PREFIX = "mediumship:progress:";

// Below this we treat playback as "just started" and do not resume/save.
export const MIN_RESUMABLE_SECONDS = 5;
// Within this window of the end we consider the episode finished and clear it.
export const END_THRESHOLD_SECONDS = 15;

function keyFor(contentId: string): string {
  return `${STORAGE_PREFIX}${contentId}`;
}

export async function loadPlaybackProgress(
  contentId: string,
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(contentId));
    if (raw === null) {
      return null;
    }
    const seconds = Number(raw);
    return Number.isFinite(seconds) && seconds >= MIN_RESUMABLE_SECONDS
      ? seconds
      : null;
  } catch {
    return null;
  }
}

export async function savePlaybackProgress(
  contentId: string,
  seconds: number,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(contentId), String(Math.floor(seconds)));
  } catch {
    // Progress saving is best-effort; never block playback on storage errors.
  }
}

export async function clearPlaybackProgress(contentId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(contentId));
  } catch {
    // best-effort
  }
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
  if (
    durationSeconds !== undefined &&
    durationSeconds > 0 &&
    savedSeconds >= durationSeconds - END_THRESHOLD_SECONDS
  ) {
    return null;
  }
  return savedSeconds;
}
