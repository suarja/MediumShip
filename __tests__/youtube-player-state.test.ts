import {
  decideYoutubeResumeSeek,
  INITIAL_YOUTUBE_PLAYER_SNAPSHOT,
  reduceYoutubePlayerState,
  resolveYoutubeResumeTarget,
} from "../src/features/media/youtube-player-state";

describe("reduceYoutubePlayerState", () => {
  it("maps playing and buffering states", () => {
    expect(
      reduceYoutubePlayerState(INITIAL_YOUTUBE_PLAYER_SNAPSHOT, "playing"),
    ).toEqual({
      isPlaying: true,
      hasFinished: false,
      isBuffering: false,
    });

    expect(
      reduceYoutubePlayerState(INITIAL_YOUTUBE_PLAYER_SNAPSHOT, "buffering"),
    ).toEqual({
      isPlaying: true,
      hasFinished: false,
      isBuffering: true,
    });
  });

  it("maps paused and ended states", () => {
    expect(
      reduceYoutubePlayerState(INITIAL_YOUTUBE_PLAYER_SNAPSHOT, "paused"),
    ).toEqual({
      isPlaying: false,
      hasFinished: false,
      isBuffering: false,
    });

    expect(
      reduceYoutubePlayerState(INITIAL_YOUTUBE_PLAYER_SNAPSHOT, "ended"),
    ).toEqual({
      isPlaying: false,
      hasFinished: true,
      isBuffering: false,
    });
  });

  it("treats unknown states as idle", () => {
    expect(
      reduceYoutubePlayerState(INITIAL_YOUTUBE_PLAYER_SNAPSHOT, "unstarted"),
    ).toEqual({
      isPlaying: false,
      hasFinished: false,
      isBuffering: false,
    });
  });
});

describe("decideYoutubeResumeSeek", () => {
  it("seeks when a resume target is ahead of the current position", () => {
    expect(
      decideYoutubeResumeSeek({
        preferredResumeSeconds: 120,
        currentSeconds: 0,
        resumeAlreadyApplied: false,
      }),
    ).toEqual({ action: "seek", targetSeconds: 120 });
  });

  it("skips when resume was already applied for this content", () => {
    expect(
      decideYoutubeResumeSeek({
        preferredResumeSeconds: 120,
        currentSeconds: 0,
        resumeAlreadyApplied: true,
      }),
    ).toEqual({ action: "skip", reason: "already-applied" });
  });

  it("skips when there is no resume target", () => {
    expect(
      decideYoutubeResumeSeek({
        preferredResumeSeconds: null,
        currentSeconds: 0,
        resumeAlreadyApplied: false,
      }),
    ).toEqual({ action: "skip", reason: "no-target" });
  });

  it("skips when playback is already at or past the target", () => {
    expect(
      decideYoutubeResumeSeek({
        preferredResumeSeconds: 60,
        currentSeconds: 60,
        resumeAlreadyApplied: false,
      }),
    ).toEqual({ action: "skip", reason: "at-target" });
  });
});

describe("resolveYoutubeResumeTarget", () => {
  it("delegates to the shared resume resolver", () => {
    expect(resolveYoutubeResumeTarget(90, 600)).toBe(90);
    expect(resolveYoutubeResumeTarget(2, 600)).toBeNull();
    expect(resolveYoutubeResumeTarget(590, 600)).toBeNull();
  });
});
