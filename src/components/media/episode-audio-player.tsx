import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import { usePersistentEpisodePlayer } from "../../features/media/persistent-episode-player";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { formatMediaClock } from "../../features/media/format-media-clock";

type EpisodeAudioPlayerProps = {
  audioUrl: string;
  contentId: string;
  durationSeconds?: number;
  title: string;
};

export function EpisodeAudioPlayer({
  audioUrl,
  contentId,
  durationSeconds: fallbackDurationSeconds,
  title,
}: EpisodeAudioPlayerProps) {
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
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
    togglePlayback,
  } = usePersistentEpisodePlayer();

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
        durationSeconds: fallbackDurationSeconds,
      });
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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xl,
        },
      ]}
    >
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

      <View style={[styles.progressTrack, { backgroundColor: theme.colors.accentSoft }]}>
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
        <Pressable
          accessibilityRole="button"
          disabled={!isActive}
          onPress={() => void handleSeekBy(-15)}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
              opacity: !isActive ? 0.45 : 1,
            },
            pressed && isActive && styles.pressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            {t("skipBack")}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleTogglePlayback()}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radii.pill,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: theme.colors.accentContrast,
                fontSize: 15 * scaleFont,
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
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
              opacity: !isActive ? 0.45 : 1,
            },
            pressed && isActive && styles.pressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            {t("skipForward")}
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
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    minWidth: 88,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
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
