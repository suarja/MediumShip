import {
  createAudioPlaybackEngine,
  createVideoPlaybackEngine,
  NULL_PLAYBACK_ENGINE,
  type VideoPlaybackState,
} from "./playback-engine";

describe("createAudioPlaybackEngine", () => {
  const baseStatus = {
    currentTime: 12,
    duration: 0,
    playing: true,
    isBuffering: false,
    didJustFinish: false,
    error: null,
  };

  it("maps status and falls back to the track duration when unknown", () => {
    const calls: string[] = [];
    const engine = createAudioPlaybackEngine({
      player: {
        play: () => calls.push("play"),
        pause: () => calls.push("pause"),
        seekTo: (s: number) => calls.push(`seek:${s}`),
      } as never,
      status: baseStatus as never,
      fallbackDuration: 300,
    });

    expect(engine.currentTime).toBe(12);
    expect(engine.duration).toBe(300); // status.duration 0 → fallback
    expect(engine.isPlaying).toBe(true);

    engine.play();
    void engine.seekTo(42);
    expect(calls).toEqual(["play", "seek:42"]);
  });

  it("reports justFinished from the audio status", () => {
    const engine = createAudioPlaybackEngine({
      player: {} as never,
      status: { ...baseStatus, didJustFinish: true } as never,
      fallbackDuration: 0,
    });
    expect(engine.justFinished).toBe(true);
  });
});

describe("createVideoPlaybackEngine", () => {
  it("seekTo sets the native time and optimistically updates state", () => {
    const state: VideoPlaybackState = {
      currentTimeSeconds: 5,
      durationSeconds: 0,
      isBuffering: false,
      isPlaying: true,
      playbackError: null,
    };
    const player: { currentTime?: number; play: () => void; pause: () => void } = {
      play: () => {},
      pause: () => {},
    };
    let next: VideoPlaybackState | null = null;

    const engine = createVideoPlaybackEngine({
      player: player as never,
      state,
      setState: ((fn: (c: VideoPlaybackState) => VideoPlaybackState) => {
        next = fn(state);
      }) as never,
      fallbackDuration: 120,
    });

    expect(engine.duration).toBe(120); // state.durationSeconds 0 → fallback
    expect(engine.justFinished).toBe(false);

    void engine.seekTo(33);
    expect(player.currentTime).toBe(33);
    expect(next?.currentTimeSeconds).toBe(33);
  });
});

describe("NULL_PLAYBACK_ENGINE", () => {
  it("reads empty and its actions are safe no-ops", () => {
    expect(NULL_PLAYBACK_ENGINE.currentTime).toBe(0);
    expect(NULL_PLAYBACK_ENGINE.isPlaying).toBe(false);
    expect(() => {
      NULL_PLAYBACK_ENGINE.play();
      NULL_PLAYBACK_ENGINE.pause();
      void NULL_PLAYBACK_ENGINE.seekTo(10);
    }).not.toThrow();
  });
});
