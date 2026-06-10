import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";
import { useConvexAuth } from "convex/react";
import { useEventListener } from "expo";
import { useRouter, useSegments } from "expo-router";
import { useVideoPlayer, type VideoPlayer } from "expo-video";

import { useIsMember } from "../membership/use-is-member";
import { useContentEngagement } from "../discovery/use-content-engagement";
import { hasCapability } from "../tenant/public-config";
import { useAppTheme } from "../theme/theme-provider";
import {
  createAudioPlaybackEngine,
  createVideoPlaybackEngine,
  NULL_PLAYBACK_ENGINE,
  type VideoPlaybackState,
} from "./playback-engine";
import { MIN_RESUMABLE_SECONDS } from "./playback-progress";
import { usePlaybackProgress } from "./use-playback-progress";
import { VideoPipHost } from "./video-pip-host";

export const PERSISTENT_MEDIA_PLAYER_HEIGHT = 64;
export const PERSISTENT_MEDIA_PLAYER_GAP = 8;
const audioModeConfig = {
  interruptionMode: "doNotMix" as const,
  playsInSilentMode: true,
  shouldPlayInBackground: true,
};
const audioLockScreenOptions = {
  showSeekForward: true,
  showSeekBackward: true,
};

function buildAudioMetadata(track: EpisodeTrack) {
  return {
    title: track.title,
    artworkUrl: track.artworkUrl,
  };
}

export type EpisodeTrack = {
  contentId: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string;
  durationSeconds?: number;
};

export type HostedVideoTrack = {
  contentId: string;
  title: string;
  playbackUrl: string;
  artworkUrl?: string;
  durationSeconds?: number;
};

export type ActiveMediaSession =
  | ({ kind: "episode" } & EpisodeTrack)
  | ({ kind: "hostedVideo" } & HostedVideoTrack);

type PersistentMediaPlayerContextValue = {
  activeSession: ActiveMediaSession | null;
  activeTrack: EpisodeTrack | null;
  currentTimeSeconds: number;
  durationSeconds: number;
  isBuffering: boolean;
  isPlaying: boolean;
  hasFinished: boolean;
  playbackError: string | null;
  videoPlayer: VideoPlayer | null;
  playEpisode: (track: EpisodeTrack) => Promise<void>;
  playHostedVideo: (track: HostedVideoTrack) => Promise<void>;
  playTrack: (track: EpisodeTrack) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekBy: (deltaSeconds: number) => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  closePlayer: () => void;
  openPlayer: () => void;
};

const fallbackContextValue: PersistentMediaPlayerContextValue = {
  activeSession: null,
  activeTrack: null,
  currentTimeSeconds: 0,
  durationSeconds: 0,
  isBuffering: false,
  isPlaying: false,
  hasFinished: false,
  playbackError: null,
  videoPlayer: null,
  playEpisode: async () => {},
  playHostedVideo: async () => {},
  playTrack: async () => {},
  togglePlayback: async () => {},
  seekBy: async () => {},
  seekTo: async () => {},
  closePlayer: () => {},
  openPlayer: () => {},
};

const PersistentMediaPlayerContext =
  createContext<PersistentMediaPlayerContextValue>(fallbackContextValue);

function safelyReleasePlayer(action: () => void, ignoredMessage: string) {
  try {
    action();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("AppContextLost") ||
        error.message.includes("NativeSharedObjectNotFoundException"))
    ) {
      return;
    }

    console.warn(ignoredMessage, error);
  }
}

function clampTime(seconds: number, durationSeconds: number) {
  if (durationSeconds <= 0) {
    return Math.max(0, seconds);
  }

  return Math.max(0, Math.min(durationSeconds, seconds));
}

export function shouldHideMiniPlayerForSegments(segments: readonly string[]) {
  return segments[0] === "player";
}

export function PersistentMediaPlayerProvider({
  children,
}: PropsWithChildren) {
  const [activeSession, setActiveSession] = useState<ActiveMediaSession | null>(null);
  const [videoState, setVideoState] = useState<VideoPlaybackState>({
    currentTimeSeconds: 0,
    durationSeconds: 0,
    isBuffering: false,
    isPlaying: false,
    playbackError: null,
  });
  const [isVideoDurationFromPlayer, setIsVideoDurationFromPlayer] =
    useState(false);
  const activeSessionRef = useRef<ActiveMediaSession | null>(null);
  const pendingResumeRef = useRef<{ contentId: string; seconds: number } | null>(
    null,
  );
  const appliedResumeRef = useRef<string | null>(null);
  const playIntentRef = useRef(true);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useConvexAuth();
  const { isMember } = useIsMember();
  const { enabledModules } = useAppTheme();
  const [audioPlayer, setAudioPlayer] = useState(() =>
    createAudioPlayer(null, { updateInterval: 250 }),
  );
  const canSyncRemoteProgress =
    isAuthenticated &&
    isMember &&
    hasCapability(enabledModules, "progressSync");
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const hostedVideoSession =
    activeSession?.kind === "hostedVideo"
      ? {
          uri: activeSession.playbackUrl,
          metadata: {
            artwork: activeSession.artworkUrl,
            title: activeSession.title,
          },
        }
      : null;
  const videoPlayer = useVideoPlayer(hostedVideoSession);

  useEffect(() => {
    void setAudioModeAsync(audioModeConfig);
  }, []);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    setIsVideoDurationFromPlayer(false);
    if (activeSession?.kind !== "hostedVideo") {
      setVideoState({
        currentTimeSeconds: 0,
        durationSeconds: 0,
        isBuffering: false,
        isPlaying: false,
        playbackError: null,
      });
    } else {
      videoPlayer.timeUpdateEventInterval = 0.25;
      videoPlayer.staysActiveInBackground = true;
      videoPlayer.showNowPlayingNotification = true;
    }
  }, [activeSession, videoPlayer]);

  useEventListener(videoPlayer, "playingChange", ({ isPlaying }) => {
    if (activeSessionRef.current?.kind !== "hostedVideo") {
      return;
    }

    setVideoState((current) => ({ ...current, isPlaying }));
  });

  useEventListener(videoPlayer, "timeUpdate", ({ currentTime }) => {
    if (activeSessionRef.current?.kind !== "hostedVideo") {
      return;
    }

    setVideoState((current) => ({
      ...current,
      currentTimeSeconds: currentTime,
    }));
  });

  useEventListener(videoPlayer, "sourceLoad", (payload: { duration?: number }) => {
    if (activeSessionRef.current?.kind !== "hostedVideo") {
      return;
    }

    const loadedDuration = payload.duration ?? 0;
    if (loadedDuration > 0) {
      setIsVideoDurationFromPlayer(true);
    }

    setVideoState((current) => ({
      ...current,
      durationSeconds:
        loadedDuration > 0
          ? loadedDuration
          : activeSessionRef.current?.durationSeconds ?? 0,
    }));

    const resume = pendingResumeRef.current;
    if (resume && resume.contentId === activeSessionRef.current.contentId) {
      pendingResumeRef.current = null;
      (videoPlayer as { currentTime?: number }).currentTime = resume.seconds;
      setVideoState((current) => ({
        ...current,
        currentTimeSeconds: resume.seconds,
      }));
    }
  });

  useEventListener(
    videoPlayer,
    "statusChange",
    (payload: { error?: { message?: string }; status: string }) => {
      if (activeSessionRef.current?.kind !== "hostedVideo") {
        return;
      }

      setVideoState((current) => ({
        ...current,
        isBuffering: payload.status === "loading",
        playbackError: payload.error?.message ?? null,
      }));
    },
  );

  useEventListener(videoPlayer, "playToEnd", () => {
    if (activeSessionRef.current?.kind !== "hostedVideo") {
      return;
    }

    setVideoState((current) => ({
      ...current,
      currentTimeSeconds: current.durationSeconds,
      isPlaying: false,
    }));
  });

  const activeTrack =
    activeSession?.kind === "episode"
      ? {
          audioUrl: activeSession.audioUrl,
          artworkUrl: activeSession.artworkUrl,
          contentId: activeSession.contentId,
          durationSeconds: activeSession.durationSeconds,
          title: activeSession.title,
        }
      : null;

  const engine =
    activeSession?.kind === "hostedVideo"
      ? createVideoPlaybackEngine({
          player: videoPlayer,
          state: videoState,
          setState: setVideoState,
          fallbackDuration: activeSession.durationSeconds ?? 0,
        })
      : activeSession?.kind === "episode"
        ? createAudioPlaybackEngine({
            player: audioPlayer,
            status: audioStatus,
            fallbackDuration: activeTrack?.durationSeconds ?? 0,
          })
        : NULL_PLAYBACK_ENGINE;

  const currentTimeSeconds = engine.currentTime;
  const durationSeconds = engine.duration;
  const isBuffering = engine.isBuffering;
  const isPlaying = engine.isPlaying;
  const playbackError = engine.error;
  const hasFinished =
    engine.justFinished ||
    (durationSeconds > 0 && currentTimeSeconds >= durationSeconds);
  const latestPlaybackRef = useRef({
    contentId: null as string | null,
    seconds: 0,
    finished: false,
  });

  latestPlaybackRef.current = {
    contentId: activeSession?.contentId ?? null,
    seconds: currentTimeSeconds,
    finished: hasFinished,
  };

  const mediaKind =
    activeSession?.kind === "episode"
      ? "episode"
      : activeSession?.kind === "hostedVideo"
        ? "video"
        : undefined;
  const progressRatio =
    durationSeconds > 0 ? currentTimeSeconds / durationSeconds : 0;

  useContentEngagement({
    contentId: activeSession?.contentId as never,
    kind: mediaKind,
    enabled: Boolean(activeSession && mediaKind),
    recordOpen: false,
    consumption: { progressRatio },
  });

  const persistableDurationSeconds =
    activeSession?.kind === "hostedVideo"
      ? isVideoDurationFromPlayer && videoState.durationSeconds > 0
        ? videoState.durationSeconds
        : undefined
      : activeSession?.kind === "episode" &&
          audioStatus.isLoaded &&
          audioStatus.duration > 0
        ? audioStatus.duration
        : undefined;

  const { preferredResumeSeconds, saveFinal } = usePlaybackProgress({
    contentId: activeSession?.contentId ?? null,
    durationSeconds,
    persistableDurationSeconds,
    currentSeconds: currentTimeSeconds,
    canSyncRemote: canSyncRemoteProgress,
  });

  const disableAudioLockScreen = () => {
    safelyReleasePlayer(
      () => audioPlayer.clearLockScreenControls(),
      "Failed to clear lock screen controls",
    );
  };

  useEffect(() => {
    return () => {
      safelyReleasePlayer(
        () => audioPlayer.remove(),
        "Failed to release audio player",
      );
    };
  }, [audioPlayer]);

  useEffect(() => {
    const resume = pendingResumeRef.current;
    if (
      resume &&
      activeSession?.kind === "episode" &&
      activeSession.contentId === resume.contentId &&
      audioStatus.isLoaded
    ) {
      pendingResumeRef.current = null;
      void audioPlayer.seekTo(resume.seconds);
    }
  }, [activeSession, audioPlayer, audioStatus.isLoaded]);

  useEffect(() => {
    if (!activeSession || preferredResumeSeconds === null) {
      return;
    }
    if (appliedResumeRef.current === activeSession.contentId) {
      return;
    }

    const { contentId, kind } = activeSession;
    const target = preferredResumeSeconds;

    if (target <= currentTimeSeconds + 1) {
      appliedResumeRef.current = contentId;
      return;
    }

    if (kind === "episode") {
      if (!audioStatus.isLoaded) {
        pendingResumeRef.current = { contentId, seconds: target };
        return;
      }
      appliedResumeRef.current = contentId;
      pendingResumeRef.current = null;
      void audioPlayer.seekTo(target);
      return;
    }

    if (kind === "hostedVideo") {
      appliedResumeRef.current = contentId;
      pendingResumeRef.current = { contentId, seconds: target };
      (videoPlayer as { currentTime?: number }).currentTime = target;
      setVideoState((current) => ({ ...current, currentTimeSeconds: target }));
    }
  }, [
    activeSession,
    audioPlayer,
    audioStatus.isLoaded,
    currentTimeSeconds,
    preferredResumeSeconds,
    videoPlayer,
  ]);

  const flushActiveProgress = () => {
    const snapshot = latestPlaybackRef.current;
    if (
      snapshot.contentId &&
      snapshot.seconds >= MIN_RESUMABLE_SECONDS &&
      !snapshot.finished
    ) {
      saveFinal(snapshot.seconds);
    }
  };

  const playEpisode = async (track: EpisodeTrack) => {
    const isSameTrack =
      activeSessionRef.current?.kind === "episode" &&
      activeSessionRef.current.contentId === track.contentId &&
      activeSessionRef.current.audioUrl === track.audioUrl;

    if (!isSameTrack) {
      flushActiveProgress();
      safelyReleasePlayer(
        () => videoPlayer.pause(),
        "Failed to pause hosted video player",
      );

      const nextPlayer = createAudioPlayer(
        { uri: track.audioUrl },
        { updateInterval: 250 },
      );
      nextPlayer.play();
      safelyReleasePlayer(
        () =>
          nextPlayer.setActiveForLockScreen(
            true,
            buildAudioMetadata(track),
            audioLockScreenOptions,
          ),
        "Failed to enable lock screen controls",
      );

      const nextSession: ActiveMediaSession = { kind: "episode", ...track };
      activeSessionRef.current = nextSession;
      setActiveSession(nextSession);
      setAudioPlayer((currentPlayer) => {
        safelyReleasePlayer(
          () => currentPlayer.pause(),
          "Failed to pause previous audio player",
        );
        safelyReleasePlayer(
          () => currentPlayer.remove(),
          "Failed to release previous audio player",
        );
        return nextPlayer;
      });
      return;
    }

    if (hasFinished) {
      await audioPlayer.seekTo(0);
    }

    audioPlayer.play();
  };

  const playHostedVideo = async (track: HostedVideoTrack) => {
    const isSameTrack =
      activeSessionRef.current?.kind === "hostedVideo" &&
      activeSessionRef.current.contentId === track.contentId &&
      activeSessionRef.current.playbackUrl === track.playbackUrl;

    playIntentRef.current = true;

    if (!isSameTrack) {
      flushActiveProgress();
      safelyReleasePlayer(() => audioPlayer.pause(), "Failed to pause audio player");
      disableAudioLockScreen();

      const nextSession: ActiveMediaSession = { kind: "hostedVideo", ...track };
      activeSessionRef.current = nextSession;
      setActiveSession(nextSession);
      setVideoState({
        currentTimeSeconds: 0,
        durationSeconds: track.durationSeconds || 0,
        isBuffering: true,
        isPlaying: true,
        playbackError: null,
      });
      return;
    }

    if (hasFinished) {
      (videoPlayer as { currentTime?: number }).currentTime = 0;
    }

    videoPlayer.play();
  };

  useEffect(() => {
    if (activeSession?.kind === "hostedVideo") {
      videoPlayer.play();
    }
  }, [activeSession, videoPlayer]);

  const hostedVideoActive = activeSession?.kind === "hostedVideo";

  const togglePlayback = async () => {
    if (!activeSession) {
      return;
    }

    if (engine.isPlaying) {
      playIntentRef.current = false;
      engine.pause();
      return;
    }

    if (hasFinished) {
      await engine.seekTo(0);
    }

    playIntentRef.current = true;
    engine.play();
  };

  const seekBy = async (deltaSeconds: number) => {
    if (!activeSession) {
      return;
    }

    await engine.seekTo(clampTime(currentTimeSeconds + deltaSeconds, durationSeconds));
  };

  const seekTo = async (seconds: number) => {
    if (!activeSession) {
      return;
    }

    const target = clampTime(seconds, durationSeconds);
    await engine.seekTo(target);
    if (target >= MIN_RESUMABLE_SECONDS && !hasFinished) {
      saveFinal(target);
    }
  };

  const closePlayer = () => {
    const closing = activeSessionRef.current;

    safelyReleasePlayer(() => engine.pause(), "Failed to pause player");
    if (closing?.kind === "episode") {
      disableAudioLockScreen();
    }

    if (closing && currentTimeSeconds >= MIN_RESUMABLE_SECONDS && !hasFinished) {
      saveFinal(currentTimeSeconds);
    }

    activeSessionRef.current = null;
    appliedResumeRef.current = null;
    setActiveSession(null);
  };

  const openPlayer = () => {
    if (!activeSessionRef.current) {
      return;
    }

    if (segments[0] === "player") {
      return;
    }

    router.push(`/player/${activeSessionRef.current.contentId}` as never);
  };

  const value: PersistentMediaPlayerContextValue = {
    activeSession,
    activeTrack,
    currentTimeSeconds,
    durationSeconds,
    isBuffering,
    isPlaying,
    hasFinished,
    playbackError,
    videoPlayer,
    playEpisode,
    playHostedVideo,
    playTrack: playEpisode,
    togglePlayback,
    seekBy,
    seekTo,
    closePlayer,
    openPlayer,
  };

  return (
    <PersistentMediaPlayerContext.Provider value={value}>
      {children}
      <VideoPipHost
        active={hostedVideoActive}
        isPlaying={isPlaying}
        onReturnToPlayer={openPlayer}
        playIntentRef={playIntentRef}
        player={videoPlayer}
      />
    </PersistentMediaPlayerContext.Provider>
  );
}

export function usePersistentMediaPlayer() {
  return useContext(PersistentMediaPlayerContext);
}

export function usePersistentMediaPlayerSpace() {
  const { activeSession } = usePersistentMediaPlayer();
  const segments = useSegments();

  return activeSession?.kind === "episode" &&
    !shouldHideMiniPlayerForSegments(segments)
    ? PERSISTENT_MEDIA_PLAYER_HEIGHT + PERSISTENT_MEDIA_PLAYER_GAP
    : 0;
}

export const PersistentEpisodePlayerProvider = PersistentMediaPlayerProvider;
export const usePersistentEpisodePlayer = usePersistentMediaPlayer;
export const usePersistentEpisodePlayerSpace = usePersistentMediaPlayerSpace;
