import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

function formatMediaClock(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

type EpisodeAudioPlayerProps = {
  audioUrl: string;
  title: string;
};

export function EpisodeAudioPlayer({
  audioUrl,
  title,
}: EpisodeAudioPlayerProps) {
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const player = useAudioPlayer({ uri: audioUrl }, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const durationSeconds = status.duration || 0;
  const currentTimeSeconds = Math.min(status.currentTime || 0, durationSeconds || Number.MAX_SAFE_INTEGER);
  const progressRatio =
    durationSeconds > 0 ? Math.min(currentTimeSeconds / durationSeconds, 1) : 0;
  const hasFinished = Boolean(status.didJustFinish) || (
    durationSeconds > 0 && currentTimeSeconds >= durationSeconds
  );

  const handleTogglePlayback = async () => {
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
    const nextTime = Math.max(
      0,
      Math.min(durationSeconds || currentTimeSeconds + deltaSeconds, currentTimeSeconds + deltaSeconds),
    );
    await player.seekTo(nextTime);
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
          {formatMediaClock(currentTimeSeconds)}
        </Text>
        {status.isBuffering && !status.playing ? (
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
            {formatMediaClock(durationSeconds)}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void seekBy(-15)}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
            },
            pressed && styles.pressed,
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
            {hasFinished ? t("replay") : status.playing ? t("pause") : t("play")}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void seekBy(30)}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            {t("skipForward")}
          </Text>
        </Pressable>
      </View>

      {status.error ? (
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
