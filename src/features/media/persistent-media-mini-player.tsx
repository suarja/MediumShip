import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { PauseGlyph, PlayGlyph, ReplayGlyph } from "../../components/media/player-icons";
import { useTabBarSpace } from "../../components/navigation/app-tab-bar";
import { useResponsive } from "../responsive/use-responsive";
import { fontFamilies } from "../theme/fonts";
import { useAppTheme } from "../theme/theme-provider";
import { formatMediaClock } from "./format-media-clock";
import {
  PERSISTENT_MEDIA_PLAYER_GAP,
  PERSISTENT_MEDIA_PLAYER_HEIGHT,
  shouldHideMiniPlayerForSegments,
  usePersistentMediaPlayer,
} from "./persistent-episode-player";

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
    activeSession.kind === "episode"
      ? tEpisode("playerLabel")
      : tVideo("playVideo");
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
              { color: theme.colors.accent, fontSize: 12 * scaleFont },
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
              { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
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

// Legacy alias kept for older imports.
export const PersistentEpisodeMiniPlayer = PersistentMediaMiniPlayer;

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
