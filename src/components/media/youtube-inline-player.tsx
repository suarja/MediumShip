import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { useContentEngagement } from "../../features/discovery/use-content-engagement";
import { HapticsService } from "../../features/haptics/haptics";
import { usePlaybackProgress } from "../../features/media/use-playback-progress";
import {
  INITIAL_YOUTUBE_PLAYER_SNAPSHOT,
  reduceYoutubePlayerState,
  type YoutubePlayerSnapshot,
} from "../../features/media/youtube-player-state";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import {
  YoutubePlayerSurface,
  type YoutubePlayerHandle,
} from "./youtube-player";

export type YoutubeInlinePlayerHandle = {
  seekTo: (seconds: number) => void;
  getIsPlaying: () => boolean;
};

export type YoutubeInlinePlayerProps = {
  contentId: string;
  videoId: string;
  durationSeconds?: number;
  canSyncRemote: boolean;
  title?: string;
  subtitle?: string;
  summary?: string;
  launchUrl?: string;
  /** Contrasting foreground on the player screen's dark heading surface. */
  foregroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const YoutubeInlinePlayer = forwardRef<
  YoutubeInlinePlayerHandle,
  YoutubeInlinePlayerProps
>(function YoutubeInlinePlayer(
  {
    contentId,
    videoId,
    durationSeconds: catalogDurationSeconds = 0,
    canSyncRemote,
    title,
    subtitle,
    summary,
    launchUrl,
    foregroundColor,
    style,
    testID = "youtube-inline-player",
  },
  ref,
) {
  const { t } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [snapshot, setSnapshot] = useState<YoutubePlayerSnapshot>(
    INITIAL_YOUTUBE_PLAYER_SNAPSHOT,
  );
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(catalogDurationSeconds);
  const [isDurationFromPlayer, setIsDurationFromPlayer] = useState(false);

  const isPlaying = snapshot.isPlaying;
  const progressRatio =
    durationSeconds > 0 ? Math.min(currentSeconds / durationSeconds, 1) : 0;

  const persistableDurationSeconds =
    isDurationFromPlayer && durationSeconds > 0 ? durationSeconds : undefined;

  const { preferredResumeSeconds } = usePlaybackProgress({
    contentId,
    durationSeconds,
    persistableDurationSeconds,
    currentSeconds,
    canSyncRemote,
  });

  useContentEngagement({
    contentId: contentId as never,
    kind: "video",
    enabled: Boolean(contentId),
    recordOpen: false,
    consumption: { progressRatio },
  });

  const handleSnapshotChange = useCallback((next: YoutubePlayerSnapshot) => {
    setSnapshot(next);
  }, []);

  const handleStateChange = useCallback((playerState: string) => {
    setSnapshot((current) => reduceYoutubePlayerState(current, playerState));
  }, []);

  const handleTimeUpdate = useCallback(
    ({
      currentSeconds: nextCurrent,
      durationSeconds: nextDuration,
    }: {
      currentSeconds: number;
      durationSeconds: number;
    }) => {
      setCurrentSeconds(nextCurrent);
      if (nextDuration > 0) {
        setIsDurationFromPlayer(true);
        setDurationSeconds(nextDuration);
      }
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds);
      },
      getIsPlaying: () => isPlaying,
    }),
    [isPlaying],
  );

  const fg = foregroundColor ?? theme.colors.heading;

  return (
    <View style={[styles.root, style]} testID={testID}>
      <View
        style={[
          styles.videoSurface,
          {
            borderRadius: 18,
            borderColor: withAlpha(fg, 0.12),
          },
        ]}
      >
        <YoutubePlayerSurface
          ref={playerRef}
          fill
          play
          preferredResumeSeconds={preferredResumeSeconds}
          testID="youtube-player"
          videoId={videoId}
          onSnapshotChange={handleSnapshotChange}
          onStateChange={handleStateChange}
          onTimeUpdate={handleTimeUpdate}
        />
      </View>

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { fontSize: 10 * scaleFont, color: withAlpha(fg, 0.56) },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {title ? (
        <Text
          style={[
            styles.title,
            { fontSize: 27 * scaleFont, color: fg },
          ]}
        >
          {title}
        </Text>
      ) : null}

      {summary ? (
        <Text
          style={[
            styles.summary,
            { fontSize: 13 * scaleFont, color: withAlpha(fg, 0.62) },
          ]}
        >
          {summary}
        </Text>
      ) : null}

      {launchUrl ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void HapticsService.light();
              void WebBrowser.openBrowserAsync(launchUrl);
            }}
            style={({ pressed }) => [
              styles.externalLink,
              {
                backgroundColor: withAlpha(fg, 0.08),
                borderRadius: theme.radii.pill,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.externalLinkText,
                { color: fg, fontSize: 13 * scaleFont },
              ]}
            >
              {t("openExternal")}
            </Text>
          </Pressable>
          <Text style={[styles.backgroundNote, { color: withAlpha(fg, 0.5) }]}>
            {t("youtubeBackgroundNote")}
          </Text>
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 12,
  },
  videoSurface: {
    aspectRatio: 16 / 9,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    overflow: "hidden",
    width: "100%",
  },
  subtitle: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.4,
    marginTop: 4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    lineHeight: 31,
  },
  summary: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  externalLink: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  externalLinkText: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  backgroundNote: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 8,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
