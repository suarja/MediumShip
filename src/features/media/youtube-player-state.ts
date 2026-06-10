import { resolveResumeTarget } from "./playback-progress";

export type YoutubePlayerSnapshot = {
  isPlaying: boolean;
  hasFinished: boolean;
  isBuffering: boolean;
};

export const INITIAL_YOUTUBE_PLAYER_SNAPSHOT: YoutubePlayerSnapshot = {
  isPlaying: false,
  hasFinished: false,
  isBuffering: false,
};

/**
 * Maps IFrame Player API `onChangeState` events to a small playback snapshot.
 * @see https://developers.google.com/youtube/iframe_api_reference#onStateChange
 */
export function reduceYoutubePlayerState(
  _current: YoutubePlayerSnapshot,
  playerState: string,
): YoutubePlayerSnapshot {
  switch (playerState) {
    case "playing":
      return { isPlaying: true, hasFinished: false, isBuffering: false };
    case "buffering":
      return { isPlaying: true, hasFinished: false, isBuffering: true };
    case "paused":
      return { isPlaying: false, hasFinished: false, isBuffering: false };
    case "ended":
      return { isPlaying: false, hasFinished: true, isBuffering: false };
    default:
      return { isPlaying: false, hasFinished: false, isBuffering: false };
  }
}

export type YoutubeResumeDecision =
  | { action: "skip"; reason: "already-applied" | "no-target" | "at-target" }
  | { action: "seek"; targetSeconds: number };

/**
 * Pure decision for whether to seek once when the player becomes ready.
 * Reuses {@link resolveResumeTarget} semantics via a pre-resolved target.
 */
export function decideYoutubeResumeSeek(input: {
  preferredResumeSeconds: number | null;
  currentSeconds: number;
  resumeAlreadyApplied: boolean;
}): YoutubeResumeDecision {
  const { preferredResumeSeconds, currentSeconds, resumeAlreadyApplied } = input;

  if (resumeAlreadyApplied) {
    return { action: "skip", reason: "already-applied" };
  }

  if (preferredResumeSeconds === null) {
    return { action: "skip", reason: "no-target" };
  }

  if (preferredResumeSeconds <= currentSeconds + 1) {
    return { action: "skip", reason: "at-target" };
  }

  return { action: "seek", targetSeconds: preferredResumeSeconds };
}

/** Convenience wrapper when the saved position still needs end-window clamping. */
export function resolveYoutubeResumeTarget(
  savedSeconds: number | null,
  durationSeconds: number | undefined,
): number | null {
  return resolveResumeTarget(savedSeconds, durationSeconds);
}
