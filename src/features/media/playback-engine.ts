import type { Dispatch, SetStateAction } from "react";

import type { AudioPlayer, AudioStatus } from "expo-audio";
import type { VideoPlayer } from "expo-video";

// One interface over the three playback backends (expo-audio for Episode,
// expo-video for HostedVideo, react-native-youtube-iframe for YouTube) so the
// provider stops forking on session kind for every transport call and every
// derived read.
export type PlaybackEngine = {
  readonly currentTime: number;
  readonly duration: number;
  readonly isPlaying: boolean;
  readonly isBuffering: boolean;
  readonly error: string | null;
  /** True the instant playback reaches the end (audio only reports this). */
  readonly justFinished: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void | Promise<void>;
};

export type VideoPlaybackState = {
  currentTimeSeconds: number;
  durationSeconds: number;
  isBuffering: boolean;
  isPlaying: boolean;
  playbackError: string | null;
};

// Used when no session is active: every read is empty and every action a no-op.
export const NULL_PLAYBACK_ENGINE: PlaybackEngine = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isBuffering: false,
  error: null,
  justFinished: false,
  play: () => {},
  pause: () => {},
  seekTo: () => {},
};

export function createAudioPlaybackEngine(input: {
  player: AudioPlayer;
  status: AudioStatus;
  fallbackDuration: number;
}): PlaybackEngine {
  const { player, status, fallbackDuration } = input;
  return {
    currentTime: status.currentTime || 0,
    duration: status.duration || fallbackDuration || 0,
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    error: status.error,
    justFinished: Boolean(status.didJustFinish),
    play: () => player.play(),
    pause: () => player.pause(),
    seekTo: (seconds: number) => player.seekTo(seconds),
  };
}

export function createVideoPlaybackEngine(input: {
  player: VideoPlayer;
  state: VideoPlaybackState;
  setState: Dispatch<SetStateAction<VideoPlaybackState>>;
  fallbackDuration: number;
}): PlaybackEngine {
  const { player, state, setState, fallbackDuration } = input;
  return {
    currentTime: state.currentTimeSeconds,
    duration: state.durationSeconds || fallbackDuration || 0,
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    error: state.playbackError,
    justFinished: false,
    play: () => player.play(),
    pause: () => player.pause(),
    seekTo: (seconds: number) => {
      (player as { currentTime?: number }).currentTime = seconds;
      setState((current) => ({ ...current, currentTimeSeconds: seconds }));
    },
  };
}

export type YoutubePlaybackCommands = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
};

export function createYoutubePlaybackEngine(input: {
  state: VideoPlaybackState;
  setState: Dispatch<SetStateAction<VideoPlaybackState>>;
  commands: YoutubePlaybackCommands;
  fallbackDuration: number;
}): PlaybackEngine {
  const { state, setState, commands, fallbackDuration } = input;
  return {
    currentTime: state.currentTimeSeconds,
    duration: state.durationSeconds || fallbackDuration || 0,
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    error: state.playbackError,
    justFinished:
      state.durationSeconds > 0 &&
      state.currentTimeSeconds >= state.durationSeconds,
    play: () => {
      commands.play();
      setState((current) => ({ ...current, isPlaying: true }));
    },
    pause: () => {
      commands.pause();
      setState((current) => ({ ...current, isPlaying: false }));
    },
    seekTo: (seconds: number) => {
      commands.seekTo(seconds);
      setState((current) => ({ ...current, currentTimeSeconds: seconds }));
    },
  };
}
