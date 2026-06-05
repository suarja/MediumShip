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
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEventListener } from "expo";
import { useRouter, useSegments } from "expo-router";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { PauseGlyph, PlayGlyph, ReplayGlyph } from "../../components/media/player-icons";
import { useTabBarSpace } from "../../components/navigation/app-tab-bar";
import { api } from "../../../convex/_generated/api";
import { useIsMember } from "../membership/use-is-member";
import { useResponsive } from "../responsive/use-responsive";
import { fontFamilies } from "../theme/fonts";
import { useAppTheme } from "../theme/theme-provider";
import { formatMediaClock } from "./format-media-clock";
import {
  clearPlaybackProgress,
  loadPlaybackProgress,
  MIN_RESUMABLE_SECONDS,
  resolvePreferredProgress,
  resolveProgressAction,
  resolveResumeTarget,
  savePlaybackProgress,
} from "./playback-progress";

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
  const pendingResumeRef = useRef<{ contentId: string; seconds: number } | null>(
    null,
  );
  const resumeSeedRef = useRef<{ contentId: string; seconds: number | null } | null>(
    null,
  );
  const lastSavedProgressRef = useRef(0);
  const pipHostRef = useRef<VideoView>(null);
  // User's *intent* to play, toggled only by explicit play/pause actions — not
  // by iOS's transient pauses during the PiP-stop transition. Used to restore
  // playback when returning to the player.
  const playIntentRef = useRef(true);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useConvexAuth();
  const { isMember } = useIsMember();
  const [audioPlayer, setAudioPlayer] = useState(() =>
    createAudioPlayer(null, { updateInterval: 250 }),
  );
  const canSyncRemoteProgress = isAuthenticated && isMember;
  const saveRemotePlaybackProgress = useMutation(
    api.playbackProgress.mutations.saveMyPlaybackProgress,
  );
  const clearRemotePlaybackProgress = useMutation(
    api.playbackProgress.mutations.clearMyPlaybackProgress,
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
  const remotePlaybackProgress = useQuery(
    api.playbackProgress.queries.getMyPlaybackProgress,
    canSyncRemoteProgress && activeSession
      ? { contentId: activeSession.contentId as never }
      : "skip",
  );

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

    // The source is now loaded — resume to the saved position if any.
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

  // Resume to the saved position once the freshly built player has loaded.
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
    if (!activeSession || !resumeSeedRef.current || remotePlaybackProgress === undefined) {
      return;
    }

    const currentSeed = resumeSeedRef.current;
    if (currentSeed.contentId !== activeSession.contentId) {
      return;
    }

    const mergedSeconds = resolvePreferredProgress(
      currentSeed.seconds,
      remotePlaybackProgress?.seconds ?? null,
    );
    const nextResumeTarget = resolveResumeTarget(
      mergedSeconds,
      activeSession.durationSeconds,
    );

    if (nextResumeTarget === currentSeed.seconds) {
      return;
    }

    resumeSeedRef.current = {
      contentId: activeSession.contentId,
      seconds: nextResumeTarget,
    };
    lastSavedProgressRef.current = nextResumeTarget ?? 0;
    pendingResumeRef.current =
      nextResumeTarget !== null
        ? { contentId: activeSession.contentId, seconds: nextResumeTarget }
        : null;

    if (nextResumeTarget === null || nextResumeTarget <= currentTimeSeconds + 1) {
      return;
    }

    if (activeSession.kind === "episode") {
      if (audioStatus.isLoaded) {
        pendingResumeRef.current = null;
        void audioPlayer.seekTo(nextResumeTarget);
      }
      return;
    }

    (videoPlayer as { currentTime?: number }).currentTime = nextResumeTarget;
    setVideoState((current) => ({
      ...current,
      currentTimeSeconds: nextResumeTarget,
    }));
  }, [
    activeSession,
    audioPlayer,
    audioStatus.isLoaded,
    currentTimeSeconds,
    remotePlaybackProgress,
    videoPlayer,
  ]);

  // Persist playback progress (throttled), and clear it near the end so a
  // finished item starts over next time. Applies to both audio episodes and
  // hosted video so each resumes where it was left off.
  useEffect(() => {
    if (!activeSession) {
      return;
    }

    const { contentId } = activeSession;
    const action = resolveProgressAction({
      currentSeconds: currentTimeSeconds,
      durationSeconds,
      lastSavedSeconds: lastSavedProgressRef.current,
    });

    if (action.type === "clear") {
      void clearPlaybackProgress(contentId);
      if (canSyncRemoteProgress) {
        void clearRemotePlaybackProgress({ contentId: contentId as never });
      }
    } else if (action.type === "save") {
      lastSavedProgressRef.current = action.seconds;
      void savePlaybackProgress(contentId, action.seconds);
      if (canSyncRemoteProgress) {
        void saveRemotePlaybackProgress({
          contentId: contentId as never,
          seconds: action.seconds,
        });
      }
    }
  }, [
    activeSession,
    canSyncRemoteProgress,
    clearRemotePlaybackProgress,
    currentTimeSeconds,
    durationSeconds,
    saveRemotePlaybackProgress,
  ]);

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

      // Resolve the saved listening position before building the player so we
      // can resume once the source is loaded.
      const savedSeconds = await loadPlaybackProgress(track.contentId);
      const resumeTarget = resolveResumeTarget(savedSeconds, track.durationSeconds);
      resumeSeedRef.current = {
        contentId: track.contentId,
        seconds: resumeTarget,
      };
      pendingResumeRef.current =
        resumeTarget !== null
          ? { contentId: track.contentId, seconds: resumeTarget }
          : null;
      lastSavedProgressRef.current = resumeTarget ?? 0;

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

    // Launching (or relaunching) a hosted video is an explicit intent to play.
    playIntentRef.current = true;

    if (!isSameTrack) {
      safelyReleasePlayer(() => audioPlayer.pause(), "Failed to pause audio player");
      disableAudioLockScreen();

      // Resolve the saved position before the source loads; applied on the
      // `sourceLoad` event below (seeking earlier is unreliable on native).
      const savedSeconds = await loadPlaybackProgress(track.contentId);
      const resumeTarget = resolveResumeTarget(savedSeconds, track.durationSeconds);
      resumeSeedRef.current = {
        contentId: track.contentId,
        seconds: resumeTarget,
      };
      pendingResumeRef.current =
        resumeTarget !== null
          ? { contentId: track.contentId, seconds: resumeTarget }
          : null;
      lastSavedProgressRef.current = resumeTarget ?? 0;

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

  // Picture-in-Picture is driven here, from the always-mounted offscreen host
  // (rendered below), so it survives navigation AND can be cancelled when the
  // user returns to the player. Driving it from a screen's own VideoView fails:
  // that view is torn down on navigation, and stopping PiP on a different view
  // than the one that owns it is a no-op.
  //
  // Model (decided with the user): PiP mirrors "playing while away from the
  // player". You only get a floating window when you leave the player WHILE
  // PLAYING. Pausing (in the player or via the PiP controls) dismisses PiP, so
  // there is no "close a paused PiP" case and no navigation loop.
  const onPlayerRoute = segments[0] === "player";
  const hostedVideoActive = activeSession?.kind === "hostedVideo";

  // Returning to the player: cancel PiP, then re-assert play across iOS's
  // transition pause if the user's intent is to play. Keyed on the route only,
  // so it does not re-run on every play/pause tick.
  useEffect(() => {
    if (!hostedVideoActive || !onPlayerRoute) {
      return;
    }

    void pipHostRef.current?.stopPictureInPicture().catch(() => {});
    if (!playIntentRef.current) {
      return;
    }

    const replay = () => {
      try {
        videoPlayer.play();
      } catch {
        // player may be mid-teardown; ignore
      }
    };
    replay();
    const t1 = setTimeout(replay, 60);
    const t2 = setTimeout(replay, 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hostedVideoActive, onPlayerRoute, videoPlayer]);

  // Away from the player: float the video only if we left WHILE PLAYING.
  // Leaving paused starts nothing. We deliberately do NOT auto-dismiss on
  // pause — pausing should keep the PiP window (standard behaviour), and a
  // transient pause during the restore transition must not cancel the restore.
  useEffect(() => {
    if (!hostedVideoActive || onPlayerRoute || !isPlaying) {
      return;
    }

    const timer = setTimeout(() => {
      void pipHostRef.current?.startPictureInPicture().catch(() => {});
    }, 120);
    return () => clearTimeout(timer);
  }, [hostedVideoActive, onPlayerRoute, isPlaying]);

  const togglePlayback = async () => {
    if (!activeSession) {
      return;
    }

    if (activeSession.kind === "hostedVideo") {
      if (videoState.isPlaying) {
        playIntentRef.current = false;
        videoPlayer.pause();
        return;
      }

      if (hasFinished) {
        (videoPlayer as { currentTime?: number }).currentTime = 0;
      }

      playIntentRef.current = true;
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
    const closing = activeSessionRef.current;

    if (closing?.kind === "hostedVideo") {
      safelyReleasePlayer(
        () => videoPlayer.pause(),
        "Failed to pause hosted video player",
      );
    } else if (closing) {
      safelyReleasePlayer(() => audioPlayer.pause(), "Failed to pause audio player");
      disableAudioLockScreen();
    }

    // Persist the final position so the next open resumes here — same rule for
    // audio and hosted video.
    if (
      closing &&
      currentTimeSeconds >= MIN_RESUMABLE_SECONDS &&
      !hasFinished
    ) {
      void savePlaybackProgress(closing.contentId, currentTimeSeconds);
      if (canSyncRemoteProgress) {
        void saveRemotePlaybackProgress({
          contentId: closing.contentId as never,
          seconds: currentTimeSeconds,
        });
      }
    }

    activeSessionRef.current = null;
    resumeSeedRef.current = null;
    setActiveSession(null);
  };

  const openPlayer = () => {
    if (!activeSessionRef.current) {
      return;
    }

    // Idempotent: if we are already on the player route, don't stack another.
    // This makes it safe to call from PiP-stop (the restore button), navigation,
    // and the mini-player tap without producing duplicate routes.
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
      {/* PiP host: mounted ONLY while away from the player, so it never competes
          with the player screen's own inline VideoView for the shared player
          (two live views of one player make one show a crossed-out "not
          playable"). Unmounting it on return also stops PiP. */}
      {!onPlayerRoute && activeSession?.kind === "hostedVideo" && videoPlayer ? (
        <View pointerEvents="none" style={styles.pipHostOffscreen}>
          <VideoView
            allowsPictureInPicture
            contentFit="contain"
            nativeControls={false}
            onPictureInPictureStop={() => {
              // Fired by the restore control, the close (X), AND our own
              // programmatic stop on return. expo-video does not expose iOS's
              // restore-only callback, so we distinguish by the settled play
              // state: only a RESTORE leaves the video playing. Defer so the
              // close transition has settled into the native state first.
              // (Restore => back to the player; close => stay put, no loop;
              // openPlayer is route-guarded, so the stop we trigger on return is
              // a no-op.)
              setTimeout(() => {
                if (videoPlayer?.playing) {
                  openPlayer();
                }
              }, 150);
            }}
            player={videoPlayer}
            ref={pipHostRef}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
    </PersistentMediaPlayerContext.Provider>
  );
}

export function usePersistentMediaPlayer() {
  return useContext(PersistentMediaPlayerContext);
}

export function usePersistentMediaPlayerSpace() {
  const { activeSession } = usePersistentMediaPlayer();
  const segments = useSegments();

  // Only the episode card occupies layout space the content must clear. Hosted
  // video shows no card (just the PiP window), so it reserves nothing.
  return activeSession?.kind === "episode" &&
    !shouldHideMiniPlayerForSegments(segments)
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
  const isHostedVideo = activeSession?.kind === "hostedVideo";
  const onPlayerScreen = shouldHideMiniPlayerForSegments(segments);

  if (!activeSession) {
    return null;
  }

  if (onPlayerScreen) {
    return null;
  }

  // Hosted video has no mini-player card — the system PiP window (driven by the
  // provider's always-mounted offscreen host) is its only floating UI. A card
  // would be a redundant, out-of-sync second floating player.
  if (isHostedVideo) {
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
  // Mounted (so PiP keeps running and the restore callback fires) but parked
  // offscreen, since the system PiP window is the only floating UI for video.
  pipHostOffscreen: {
    position: "absolute",
    left: -1000,
    top: 0,
    width: 200,
    height: 112,
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
