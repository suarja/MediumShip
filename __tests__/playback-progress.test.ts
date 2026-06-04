import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearPlaybackProgress,
  END_THRESHOLD_SECONDS,
  loadPlaybackProgress,
  MIN_RESUMABLE_SECONDS,
  resolveResumeTarget,
  savePlaybackProgress,
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
});

describe("playback progress persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saves and loads a position round-trip", async () => {
    await savePlaybackProgress("episode_1", 423.7);
    expect(await loadPlaybackProgress("episode_1")).toBe(423);
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
