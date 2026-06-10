import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearPlaybackProgress,
  END_THRESHOLD_SECONDS,
  loadPlaybackProgress,
  loadPlaybackProgressSnapshot,
  MIN_RESUMABLE_SECONDS,
  resolvePreferredProgress,
  resolveProgressAction,
  mergeStoredPlaybackDuration,
  resolveProgressDuration,
  resolveResumeTarget,
  savePlaybackProgress,
  SAVE_INTERVAL_SECONDS,
} from "../src/features/media/playback-progress";

describe("resolveResumeTarget", () => {
  it("returns null when there is no saved progress", () => {
    expect(resolveResumeTarget(null, 1800)).toBeNull();
  });

  it("returns null when the saved position is too early", () => {
    expect(resolveResumeTarget(MIN_RESUMABLE_SECONDS - 1, 1800)).toBeNull();
  });

  it("returns null when the saved position is within the end window", () => {
    expect(resolveResumeTarget(1800 - END_THRESHOLD_SECONDS + 1, 1800)).toBeNull();
  });

  it("returns the saved position for a mid-episode resume", () => {
    expect(resolveResumeTarget(420, 1800)).toBe(420);
  });

  it("resumes when the duration is unknown", () => {
    expect(resolveResumeTarget(420, undefined)).toBe(420);
  });

  it("resumes when saved progress exceeds the catalog duration", () => {
    expect(resolveResumeTarget(500, 120)).toBe(500);
  });
});

describe("resolveProgressDuration", () => {
  it("prefers the player-measured duration over stale catalog metadata", () => {
    expect(resolveProgressDuration(90, 180, 3240)).toBe(180);
  });

  it("extends catalog duration when playback goes past it", () => {
    expect(resolveProgressDuration(500, undefined, 120)).toBe(500);
  });

  it("falls back to catalog when stored observed duration is inflated CMS", () => {
    const duration = resolveProgressDuration(300, 1500, 1200);
    expect(duration).toBe(1200);
    expect((duration ?? 0) - 300).toBe(900);
  });

  it("keeps the longer player duration when the file exceeds catalog metadata", () => {
    expect(resolveProgressDuration(500, 600, 120)).toBe(600);
  });
});

describe("mergeStoredPlaybackDuration", () => {
  it("replaces stored duration when the player reports a new total length", () => {
    expect(mergeStoredPlaybackDuration(1500, 1200, true)).toBe(1200);
  });

  it("does not let playback position inflate stored duration", () => {
    expect(mergeStoredPlaybackDuration(1200, 300, true)).toBe(300);
  });
});

describe("resolvePreferredProgress", () => {
  it("returns null when neither source has progress", () => {
    expect(resolvePreferredProgress(null, null)).toBeNull();
  });

  it("prefers the higher of local and remote progress", () => {
    expect(resolvePreferredProgress(120, 340)).toBe(340);
    expect(resolvePreferredProgress(480, 90)).toBe(480);
  });

  it("returns the only available source when one side is missing", () => {
    expect(resolvePreferredProgress(120, null)).toBe(120);
    expect(resolvePreferredProgress(null, 340)).toBe(340);
  });
});

describe("resolveProgressAction", () => {
  it("clears near the end of a known duration", () => {
    expect(
      resolveProgressAction({
        currentSeconds: 1800 - END_THRESHOLD_SECONDS + 1,
        durationSeconds: 1800,
        lastSavedSeconds: 0,
      }),
    ).toEqual({ type: "clear" });
  });

  it("does not clear when playback exceeds the catalog duration", () => {
    expect(
      resolveProgressAction({
        currentSeconds: 500,
        durationSeconds: 120,
        lastSavedSeconds: 0,
      }),
    ).toEqual({ type: "save", seconds: 500 });
  });

  it("saves once moved far enough past the last write", () => {
    expect(
      resolveProgressAction({
        currentSeconds: 100,
        durationSeconds: 1800,
        lastSavedSeconds: 100 - SAVE_INTERVAL_SECONDS,
      }),
    ).toEqual({ type: "save", seconds: 100 });
  });

  it("does nothing below the resumable floor", () => {
    expect(
      resolveProgressAction({
        currentSeconds: MIN_RESUMABLE_SECONDS - 1,
        durationSeconds: 1800,
        lastSavedSeconds: 0,
      }),
    ).toEqual({ type: "none" });
  });

  it("does nothing when the move is within the throttle window", () => {
    expect(
      resolveProgressAction({
        currentSeconds: 100,
        durationSeconds: 1800,
        lastSavedSeconds: 100 - (SAVE_INTERVAL_SECONDS - 1),
      }),
    ).toEqual({ type: "none" });
  });

  it("still saves when the duration is unknown (live/unloaded)", () => {
    expect(
      resolveProgressAction({
        currentSeconds: 60,
        durationSeconds: 0,
        lastSavedSeconds: 0,
      }),
    ).toEqual({ type: "save", seconds: 60 });
  });
});

describe("playback progress persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saves and loads a position round-trip", async () => {
    await savePlaybackProgress("episode_1", 423.7, 1800);
    expect(await loadPlaybackProgress("episode_1")).toBe(423);
    expect(await loadPlaybackProgressSnapshot("episode_1")).toEqual({
      seconds: 423,
      durationSeconds: 1800,
    });
  });

  it("ignores positions below the resumable threshold", async () => {
    await savePlaybackProgress("episode_1", 2);
    expect(await loadPlaybackProgress("episode_1")).toBeNull();
  });

  it("clears saved progress", async () => {
    await savePlaybackProgress("episode_1", 500);
    await clearPlaybackProgress("episode_1");
    expect(await loadPlaybackProgress("episode_1")).toBeNull();
  });
});
