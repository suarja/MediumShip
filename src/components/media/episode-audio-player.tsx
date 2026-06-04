import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { usePersistentMediaPlayer } from "../../features/media/persistent-media-player";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { formatMediaClock } from "../../features/media/format-media-clock";
import { getScrubTimeFromPress } from "../../features/media/scrubbing";

type EpisodeAudioPlayerProps = {
  audioUrl: string;
  artworkUrl?: string;
  contentId: string;
  durationSeconds?: number;
  title: string;
};

export function EpisodeAudioPlayer({
  audioUrl,
  artworkUrl,
  contentId,
  durationSeconds: fallbackDurationSeconds,
  title,
}: EpisodeAudioPlayerProps) {
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const router = useRouter();
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const {
    activeTrack,
    currentTimeSeconds,
    durationSeconds,
    hasFinished,
    isBuffering,
    isPlaying,
    playbackError,
    playTrack,
    seekBy,
    seekTo,
    togglePlayback,
  } = usePersistentMediaPlayer();

  const isActive =
    activeTrack?.contentId === contentId && activeTrack.audioUrl === audioUrl;
  const resolvedCurrentTimeSeconds = isActive ? currentTimeSeconds : 0;
  const resolvedDurationSeconds = isActive
    ? durationSeconds || fallbackDurationSeconds || 0
    : fallbackDurationSeconds || 0;
  const progressRatio =
    resolvedDurationSeconds > 0
      ? Math.min(resolvedCurrentTimeSeconds / resolvedDurationSeconds, 1)
      : 0;

  const handleTogglePlayback = async () => {
    if (!isActive) {
      await playTrack({
        contentId,
        title,
        audioUrl,
        artworkUrl,
        durationSeconds: fallbackDurationSeconds,
      });
      router.push(`/player/${contentId}` as never);
      return;
    }

    await togglePlayback();
  };

  const handleSeekBy = async (deltaSeconds: number) => {
    if (!isActive) {
      return;
    }

    await seekBy(deltaSeconds);
  };

  const handleScrub = async (event: GestureResponderEvent) => {
    if (!isActive || resolvedDurationSeconds <= 0) {
      return;
    }

    await seekTo(
      getScrubTimeFromPress(
        event.nativeEvent.locationX,
        progressTrackWidth,
        resolvedDurationSeconds,
      ),
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 16,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {artworkUrl ? (
          <Image source={{ uri: artworkUrl }} style={styles.artwork} />
        ) : (
          <View
            style={[
              styles.artworkFallback,
              { backgroundColor: theme.colors.accentSoft },
            ]}
          >
            <Text style={[styles.artworkGlyph, { color: theme.colors.accent }]}>▷</Text>
          </View>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.label, { color: theme.colors.accent, fontSize: 11 * scaleFont }]}>
            {t("playerLabel")}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
                lineHeight: 24 * scaleFont,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="adjustable"
        hitSlop={6}
        onLayout={(event) => {
          setProgressTrackWidth(event.nativeEvent.layout.width);
        }}
        onPress={(event) => void handleScrub(event)}
        style={[styles.progressTrack, { backgroundColor: theme.colors.accentSoft }]}
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
      </Pressable>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
          {formatMediaClock(resolvedCurrentTimeSeconds)}
        </Text>
        {isActive && isBuffering && !isPlaying ? (
          <View style={styles.bufferingRow}>
            <ActivityIndicator color={theme.colors.accent} size="small" />
            <Text
              style={[styles.meta, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}
            >
              {t("loadingPlayer")}
            </Text>
          </View>
        ) : (
          <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
            {formatMediaClock(resolvedDurationSeconds)}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.transportGroup}>
          <Pressable
            accessibilityRole="button"
            disabled={!isActive}
            onPress={() => void handleSeekBy(-15)}
            style={({ pressed }) => [
              styles.transportButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                opacity: !isActive ? 0.45 : 1,
              },
              pressed && isActive && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.transportButtonText,
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              -15
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleTogglePlayback()}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.colors.accent,
                borderRadius: 12,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.primaryGlyph,
                { color: theme.colors.accentContrast, fontSize: 17 * scaleFont },
              ]}
            >
              {!isActive || hasFinished ? "▶" : isPlaying ? "❚❚" : "▶"}
            </Text>
            <Text
              style={[
                styles.primaryButtonText,
                {
                  color: theme.colors.accentContrast,
                  fontSize: 13 * scaleFont,
                },
              ]}
            >
              {!isActive
                ? t("play")
                : hasFinished
                  ? t("replay")
                  : isPlaying
                    ? t("pause")
                    : t("play")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!isActive}
            onPress={() => void handleSeekBy(30)}
            style={({ pressed }) => [
              styles.transportButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                opacity: !isActive ? 0.45 : 1,
              },
              pressed && isActive && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.transportButtonText,
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              +30
            </Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!isActive}
          onPress={() => router.push(`/player/${contentId}` as never)}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: 12,
              opacity: !isActive ? 0.45 : 1,
            },
            pressed && isActive && styles.pressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            {t("playerLabel")}
          </Text>
        </Pressable>
      </View>

      {isActive && playbackError ? (
        <Text style={[styles.error, { color: theme.colors.danger, fontSize: 13 * scaleFont }]}>
          {t("playbackUnavailable")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  artworkFallback: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkGlyph: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
  },
  label: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 24,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bufferingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  controls: {
    gap: 12,
  },
  transportGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  transportButton: {
    minWidth: 56,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  transportButtonText: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.3,
  },
  primaryGlyph: {
    fontFamily: fontFamilies.bodySemiBold,
    lineHeight: 18,
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  secondaryButtonText: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.84,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
