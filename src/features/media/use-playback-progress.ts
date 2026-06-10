import { useEffect, useMemo, useRef, useState } from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import {
  clearPlaybackProgress,
  loadPlaybackProgress,
  MIN_RESUMABLE_SECONDS,
  resolvePreferredProgress,
  resolveProgressAction,
  resolveResumeTarget,
  savePlaybackProgress,
} from "./playback-progress";

type UsePlaybackProgressInput = {
  /** Active content id, or null when nothing is playing. */
  contentId: string | null;
  /** Best-known duration, for clamping the resume target away from the end. */
  durationSeconds: number;
  /** Current playback position, drives the throttled save. */
  currentSeconds: number;
  /** Whether this member syncs progress to Convex (remote). */
  canSyncRemote: boolean;
};

type UsePlaybackProgressResult = {
  /**
   * Where to resume (local ⊔ remote, clamped), or null to start from the top.
   * The caller applies it to whichever engine is active. Reactive: it can
   * change once the remote value settles after the local one.
   */
  preferredResumeSeconds: number | null;
  /** Persist a final position (e.g. on close), local + remote. */
  saveFinal: (seconds: number) => void;
};

/**
 * Owns the member's PlaybackProgress: it reconciles the local (guest-first)
 * saved position with the remote (Convex) one into a single resume target, and
 * persists progress as playback advances. It never touches the audio/video
 * players — applying the resume is the caller's job, since that is engine- and
 * timing-specific.
 */
export function usePlaybackProgress({
  contentId,
  durationSeconds,
  currentSeconds,
  canSyncRemote,
}: UsePlaybackProgressInput): UsePlaybackProgressResult {
  const [localSeed, setLocalSeed] = useState<number | null>(null);
  // Throttle baseline: the last position we persisted, so we neither re-save the
  // resume point immediately nor write on every tick.
  const lastSavedRef = useRef(0);
  const latestPositionByContentRef = useRef(new Map<string, number>());

  const remote = useQuery(
    api.playbackProgress.queries.getMyPlaybackProgress,
    canSyncRemote && contentId ? { contentId: contentId as never } : "skip",
  );
  const saveRemote = useMutation(
    api.playbackProgress.mutations.saveMyPlaybackProgress,
  );
  const clearRemote = useMutation(
    api.playbackProgress.mutations.clearMyPlaybackProgress,
  );

  // Load the local saved position whenever the content changes.
  useEffect(() => {
    if (!contentId) {
      setLocalSeed(null);
      return;
    }

    let cancelled = false;
    setLocalSeed(null);
    void loadPlaybackProgress(contentId).then((seconds) => {
      if (!cancelled) {
        setLocalSeed(seconds);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  // Merge local + remote into one clamped resume target.
  const preferredResumeSeconds = useMemo(() => {
    if (!contentId) {
      return null;
    }
    // When syncing, wait for the remote query to settle so we merge with it.
    if (canSyncRemote && remote === undefined) {
      return null;
    }
    const merged = resolvePreferredProgress(
      localSeed,
      canSyncRemote ? (remote?.seconds ?? null) : null,
    );
    return resolveResumeTarget(merged, durationSeconds);
  }, [contentId, canSyncRemote, remote, localSeed, durationSeconds]);

  // Seed the throttle baseline at the resume point so we do not re-save it.
  useEffect(() => {
    lastSavedRef.current = preferredResumeSeconds ?? 0;
  }, [contentId, preferredResumeSeconds]);

  useEffect(() => {
    if (!contentId) {
      return;
    }

    latestPositionByContentRef.current.set(contentId, currentSeconds);
  }, [contentId, currentSeconds]);

  useEffect(() => {
    const trackedContentId = contentId;
    return () => {
      if (!trackedContentId) {
        return;
      }

      const seconds = latestPositionByContentRef.current.get(trackedContentId) ?? 0;
      if (seconds < MIN_RESUMABLE_SECONDS) {
        return;
      }

      const floored = Math.floor(seconds);
      const flooredDuration =
        durationSeconds > 0 ? Math.floor(durationSeconds) : undefined;
      void savePlaybackProgress(trackedContentId, floored, flooredDuration);
      if (canSyncRemote) {
        void saveRemote({
          contentId: trackedContentId as never,
          seconds: floored,
          ...(flooredDuration !== undefined
            ? { durationSeconds: flooredDuration }
            : {}),
        });
      }
    };
  }, [canSyncRemote, contentId, durationSeconds, saveRemote]);

  // Persist progress (throttled), and clear near the end so a finished item
  // starts over next time.
  useEffect(() => {
    if (!contentId) {
      return;
    }

    const action = resolveProgressAction({
      currentSeconds,
      durationSeconds,
      lastSavedSeconds: lastSavedRef.current,
    });

    const flooredDuration =
      durationSeconds > 0 ? Math.floor(durationSeconds) : undefined;

    if (action.type === "clear") {
      void clearPlaybackProgress(contentId);
      if (canSyncRemote) {
        void clearRemote({ contentId: contentId as never });
      }
    } else if (action.type === "save") {
      lastSavedRef.current = action.seconds;
      void savePlaybackProgress(contentId, action.seconds, flooredDuration);
      if (canSyncRemote) {
        void saveRemote({
          contentId: contentId as never,
          seconds: action.seconds,
          ...(flooredDuration !== undefined
            ? { durationSeconds: flooredDuration }
            : {}),
        });
      }
    }
  }, [contentId, currentSeconds, durationSeconds, canSyncRemote, clearRemote, saveRemote]);

  const saveFinal = (seconds: number) => {
    if (!contentId) {
      return;
    }
    const flooredDuration =
      durationSeconds > 0 ? Math.floor(durationSeconds) : undefined;
    void savePlaybackProgress(contentId, seconds, flooredDuration);
    if (canSyncRemote) {
      void saveRemote({
        contentId: contentId as never,
        seconds,
        ...(flooredDuration !== undefined
          ? { durationSeconds: flooredDuration }
          : {}),
      });
    }
  };

  return { preferredResumeSeconds, saveFinal };
}
