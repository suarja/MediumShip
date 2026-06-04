import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEventListener } from "expo";
import { useRouter, useSegments } from "expo-router";
import { useVideoPlayer, type VideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { PauseGlyph, PlayGlyph, ReplayGlyph } from "../../components/media/player-icons";
import { useTabBarSpace } from "../../components/navigation/app-tab-bar";
import { useResponsive } from "../responsive/use-responsive";
import { fontFamilies } from "../theme/fonts";
import { useAppTheme } from "../theme/theme-provider";
import { formatMediaClock } from "./format-media-clock";

export const PERSISTENT_MEDIA_PLAYER_HEIGHT = 64;
const PERSISTENT_MEDIA_PLAYER_GAP = 8;
const audioModeConfig = {
  interruptionMode: "doNotMix" as const,
  playsInSilentMode: true,
  shouldPlayInBackground: true,
};
// Lock screen / Dynamic Island controls require interruptionMode "doNotMix"
// (set above) so the OS associates the Now Playing session with our player.
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

type VideoPlaybackState = {
  currentTimeSeconds: number;
  durationSeconds: number;
  isBuffering: boolean;
  isPlaying: boolean;
  playbackError: string | null;
};

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

function shouldHideMiniPlayerForSegments(segments: readonly string[]) {
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
  const activeSessionRef = useRef<ActiveMediaSession | null>(null);
  const router = useRouter();
  const [audioPlayer, setAudioPlayer] = useState(() =>
    createAudioPlayer(null, { updateInterval: 250 }),
  );
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
    if (activeSession?.kind !== "hostedVideo") {
      setVideoState({
        currentTimeSeconds: 0,
        durationSeconds: 0,
        isBuffering: false,
        isPlaying: false,
        playbackError: null,
      });
      return;
    }

    videoPlayer.timeUpdateEventInterval = 0.25;
    videoPlayer.staysActiveInBackground = true;
    videoPlayer.showNowPlayingNotification = true;
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

    setVideoState((current) => ({
      ...current,
      durationSeconds:
        payload.duration ?? activeSessionRef.current?.durationSeconds ?? 0,
    }));
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
  const currentTimeSeconds =
    activeSession?.kind === "hostedVideo"
      ? videoState.currentTimeSeconds
      : audioStatus.currentTime || 0;
  const durationSeconds =
    activeSession?.kind === "hostedVideo"
      ? videoState.durationSeconds || activeSession.durationSeconds || 0
      : audioStatus.duration || activeTrack?.durationSeconds || 0;
  const isBuffering =
    activeSession?.kind === "hostedVideo"
      ? videoState.isBuffering
      : audioStatus.isBuffering;
  const isPlaying =
    activeSession?.kind === "hostedVideo"
      ? videoState.isPlaying
      : audioStatus.playing;
  const playbackError =
    activeSession?.kind === "hostedVideo"
      ? videoState.playbackError
      : audioStatus.error;
  const hasFinished =
    Boolean(audioStatus.didJustFinish) ||
    (durationSeconds > 0 && currentTimeSeconds >= durationSeconds);

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

  const playEpisode = async (track: EpisodeTrack) => {
    const isSameTrack =
      activeSessionRef.current?.kind === "episode" &&
      activeSessionRef.current.contentId === track.contentId &&
      activeSessionRef.current.audioUrl === track.audioUrl;

    if (!isSameTrack) {
      safelyReleasePlayer(
        () => videoPlayer.pause(),
        "Failed to pause hosted video player",
      );

      // Build the player with the source already attached so it loads at
      // construction, then play immediately. This is the proven pattern; a
      // null player + replace() does not reliably load on iOS.
      const nextPlayer = createAudioPlayer(
        { uri: track.audioUrl },
        { updateInterval: 250 },
      );
      nextPlayer.play();
      // Surface native Now Playing controls (lock screen, Dynamic Island,
      // Control Center). The OS drives play/pause/seek directly on this player.
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

    if (!isSameTrack) {
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

  const togglePlayback = async () => {
    if (!activeSession) {
      return;
    }

    if (activeSession.kind === "hostedVideo") {
      if (videoState.isPlaying) {
        videoPlayer.pause();
        return;
      }

      if (hasFinished) {
        (videoPlayer as { currentTime?: number }).currentTime = 0;
      }

      videoPlayer.play();
      return;
    }

    if (audioStatus.playing) {
      audioPlayer.pause();
      return;
    }

    if (hasFinished) {
      await audioPlayer.seekTo(0);
    }

    audioPlayer.play();
  };

  const seekBy = async (deltaSeconds: number) => {
    if (!activeSession) {
      return;
    }

    const nextTime = clampTime(currentTimeSeconds + deltaSeconds, durationSeconds);

    if (activeSession.kind === "hostedVideo") {
      (videoPlayer as { currentTime?: number }).currentTime = nextTime;
      setVideoState((current) => ({ ...current, currentTimeSeconds: nextTime }));
      return;
    }

    await audioPlayer.seekTo(nextTime);
  };

  const seekTo = async (seconds: number) => {
    if (!activeSession) {
      return;
    }

    const nextTime = clampTime(seconds, durationSeconds);

    if (activeSession.kind === "hostedVideo") {
      (videoPlayer as { currentTime?: number }).currentTime = nextTime;
      setVideoState((current) => ({ ...current, currentTimeSeconds: nextTime }));
      return;
    }

    await audioPlayer.seekTo(nextTime);
  };

  const closePlayer = () => {
    if (activeSessionRef.current?.kind === "hostedVideo") {
      safelyReleasePlayer(
        () => videoPlayer.pause(),
        "Failed to pause hosted video player",
      );
    } else {
      safelyReleasePlayer(() => audioPlayer.pause(), "Failed to pause audio player");
      disableAudioLockScreen();
    }

    activeSessionRef.current = null;
    setActiveSession(null);
  };

  const openPlayer = () => {
    if (!activeSessionRef.current) {
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
    </PersistentMediaPlayerContext.Provider>
  );
}

export function usePersistentMediaPlayer() {
  return useContext(PersistentMediaPlayerContext);
}

export function usePersistentMediaPlayerSpace() {
  const { activeSession } = usePersistentMediaPlayer();
  const segments = useSegments();

  return activeSession && !shouldHideMiniPlayerForSegments(segments)
    ? PERSISTENT_MEDIA_PLAYER_HEIGHT + PERSISTENT_MEDIA_PLAYER_GAP
    : 0;
}

export function PersistentMediaMiniPlayer() {
  const { t: tEpisode } = useTranslation("episode");
  const { t: tVideo } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const segments = useSegments();
  const {
    activeSession,
    currentTimeSeconds,
    durationSeconds,
    hasFinished,
    isPlaying,
    closePlayer,
    openPlayer,
    togglePlayback,
  } = usePersistentMediaPlayer();

  if (!activeSession) {
    return null;
  }

  if (shouldHideMiniPlayerForSegments(segments)) {
    return null;
  }

  const bottomOffset =
    segments[0] === "(app)"
      ? tabBarSpace - PERSISTENT_MEDIA_PLAYER_GAP
      : Math.max(insets.bottom, PERSISTENT_MEDIA_PLAYER_GAP);
  const kicker =
    activeSession.kind === "episode" ? tEpisode("playerLabel") : tVideo("playVideo");
  const progressRatio =
    durationSeconds > 0
      ? Math.min(currentTimeSeconds / durationSeconds, 1)
      : 0;
  const playButtonLabel = hasFinished ? tEpisode("replay") : isPlaying ? tEpisode("pause") : tEpisode("play");

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: bottomOffset }]}
      testID="media-mini-player"
    >
      <View
        style={[
          styles.card,
          {
            minHeight: PERSISTENT_MEDIA_PLAYER_HEIGHT,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.heading,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={openPlayer}
          style={styles.metaBlock}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.kicker,
              { color: theme.colors.accent, fontSize: 10 * scaleFont },
            ]}
          >
            {kicker}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 14 * scaleFont },
            ]}
          >
            {activeSession.title}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.accentSoft },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressRatio * 100}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.time,
              { color: theme.colors.textMuted, fontSize: 10 * scaleFont },
            ]}
          >
            {formatMediaClock(currentTimeSeconds)} · {formatMediaClock(durationSeconds)}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={playButtonLabel}
            accessibilityRole="button"
            onPress={() => void togglePlayback()}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: theme.colors.accent },
              pressed && styles.pressed,
            ]}
          >
            {hasFinished ? (
              <ReplayGlyph color={theme.colors.accentContrast} size={15} />
            ) : isPlaying ? (
              <PauseGlyph color={theme.colors.accentContrast} size={15} />
            ) : (
              <PlayGlyph color={theme.colors.accentContrast} size={15} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={closePlayer}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text
              style={[
                styles.closeButtonText,
                { color: theme.colors.textMuted, fontSize: 18 * scaleFont },
              ]}
            >
              ×
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  metaBlock: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  time: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
});

export const PersistentEpisodePlayerProvider = PersistentMediaPlayerProvider;
export const PersistentEpisodeMiniPlayer = PersistentMediaMiniPlayer;
export const usePersistentEpisodePlayer = usePersistentMediaPlayer;
export const usePersistentEpisodePlayerSpace = usePersistentMediaPlayerSpace;
