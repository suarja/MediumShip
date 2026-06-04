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
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTabBarSpace } from "../../components/navigation/app-tab-bar";
import { useResponsive } from "../responsive/use-responsive";
import { fontFamilies } from "../theme/fonts";
import { useAppTheme } from "../theme/theme-provider";
import { formatMediaClock } from "./format-media-clock";

export const PERSISTENT_EPISODE_PLAYER_HEIGHT = 88;
const PERSISTENT_EPISODE_PLAYER_GAP = 12;

type EpisodeTrack = {
  contentId: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
};

type PersistentEpisodePlayerContextValue = {
  activeTrack: EpisodeTrack | null;
  currentTimeSeconds: number;
  durationSeconds: number;
  isBuffering: boolean;
  isPlaying: boolean;
  hasFinished: boolean;
  playbackError: string | null;
  playTrack: (track: EpisodeTrack) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekBy: (deltaSeconds: number) => Promise<void>;
  closePlayer: () => void;
};

const fallbackContextValue: PersistentEpisodePlayerContextValue = {
  activeTrack: null,
  currentTimeSeconds: 0,
  durationSeconds: 0,
  isBuffering: false,
  isPlaying: false,
  hasFinished: false,
  playbackError: null,
  playTrack: async () => {},
  togglePlayback: async () => {},
  seekBy: async () => {},
  closePlayer: () => {},
};

const PersistentEpisodePlayerContext =
  createContext<PersistentEpisodePlayerContextValue>(fallbackContextValue);

export function PersistentEpisodePlayerProvider({
  children,
}: PropsWithChildren) {
  const [activeTrack, setActiveTrack] = useState<EpisodeTrack | null>(null);
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);
  const loadedTrackKeyRef = useRef<string | null>(null);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  useEffect(() => {
    if (!activeTrack) {
      loadedTrackKeyRef.current = null;
      player.pause();
      return;
    }

    const trackKey = `${activeTrack.contentId}:${activeTrack.audioUrl}`;
    if (loadedTrackKeyRef.current === trackKey) {
      return;
    }

    loadedTrackKeyRef.current = trackKey;
    player.replace({ uri: activeTrack.audioUrl });

    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      player.play();
    }
  }, [activeTrack, player]);

  const currentTimeSeconds = status.currentTime || 0;
  const durationSeconds = status.duration || activeTrack?.durationSeconds || 0;
  const hasFinished =
    Boolean(status.didJustFinish) ||
    (durationSeconds > 0 && currentTimeSeconds >= durationSeconds);

  const playTrack = async (track: EpisodeTrack) => {
    const isSameTrack =
      activeTrack?.contentId === track.contentId &&
      activeTrack.audioUrl === track.audioUrl;

    if (!isSameTrack) {
      pendingPlayRef.current = true;
      setActiveTrack(track);
      return;
    }

    if (hasFinished) {
      await player.seekTo(0);
    }

    player.play();
  };

  const togglePlayback = async () => {
    if (!activeTrack) {
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    if (hasFinished) {
      await player.seekTo(0);
    }

    player.play();
  };

  const seekBy = async (deltaSeconds: number) => {
    if (!activeTrack) {
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(
        durationSeconds || currentTimeSeconds + deltaSeconds,
        currentTimeSeconds + deltaSeconds,
      ),
    );
    await player.seekTo(nextTime);
  };

  const closePlayer = () => {
    pendingPlayRef.current = false;
    player.pause();
    setActiveTrack(null);
  };

  const value: PersistentEpisodePlayerContextValue = {
    activeTrack,
    currentTimeSeconds,
    durationSeconds,
    isBuffering: status.isBuffering,
    isPlaying: status.playing,
    hasFinished,
    playbackError: status.error,
    playTrack,
    togglePlayback,
    seekBy,
    closePlayer,
  };

  return (
    <PersistentEpisodePlayerContext.Provider value={value}>
      {children}
    </PersistentEpisodePlayerContext.Provider>
  );
}

export function usePersistentEpisodePlayer() {
  return useContext(PersistentEpisodePlayerContext);
}

export function usePersistentEpisodePlayerSpace() {
  const { activeTrack } = usePersistentEpisodePlayer();

  return activeTrack
    ? PERSISTENT_EPISODE_PLAYER_HEIGHT + PERSISTENT_EPISODE_PLAYER_GAP
    : 0;
}

export function PersistentEpisodeMiniPlayer() {
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const segments = useSegments();
  const router = useRouter();
  const {
    activeTrack,
    currentTimeSeconds,
    durationSeconds,
    hasFinished,
    isPlaying,
    togglePlayback,
    closePlayer,
  } = usePersistentEpisodePlayer();

  if (!activeTrack) {
    return null;
  }

  const bottomOffset =
    segments[0] === "(app)"
      ? tabBarSpace + PERSISTENT_EPISODE_PLAYER_GAP
      : Math.max(insets.bottom, PERSISTENT_EPISODE_PLAYER_GAP);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.card,
          {
            height: PERSISTENT_EPISODE_PLAYER_HEIGHT,
            borderRadius: theme.radii.xl,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.heading,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/episode/${activeTrack.contentId}` as never)}
          style={styles.metaBlock}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.kicker,
              { color: theme.colors.accent, fontSize: 11 * scaleFont },
            ]}
          >
            {t("playerLabel")}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 15 * scaleFont },
            ]}
          >
            {activeTrack.title}
          </Text>
          <Text
            style={[
              styles.time,
              { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
            ]}
          >
            {formatMediaClock(currentTimeSeconds)} · {formatMediaClock(durationSeconds)}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void togglePlayback()}
            style={({ pressed }) => [
              styles.playButton,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accent,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.playButtonText,
                { color: theme.colors.accentContrast, fontSize: 13 * scaleFont },
              ]}
            >
              {hasFinished ? t("replay") : isPlaying ? t("pause") : t("play")}
            </Text>
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
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  metaBlock: {
    flex: 1,
    gap: 3,
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  time: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButton: {
    minWidth: 74,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  playButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: 18,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
});
