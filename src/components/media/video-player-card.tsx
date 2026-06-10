import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useConvexAuth } from "convex/react";
import { useEventListener } from "expo";
import {
  isPictureInPictureSupported,
  useVideoPlayer,
  VideoView,
} from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

import {
  getYoutubeLaunchUrl,
  getYoutubeVideoId,
} from "../../features/content/selectors";
import type { VideoSource } from "../../features/content/types";
import { HapticsService } from "../../features/haptics/haptics";
import { usePlaybackProgress } from "../../features/media/use-playback-progress";
import { useIsMember } from "../../features/membership/use-is-member";
import { useResponsive } from "../../features/responsive/use-responsive";
import { hasCapability } from "../../features/tenant/public-config";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { MediaHeroPlayBando } from "./media-hero-play-bando";
import { YoutubePlayerSurface } from "./youtube-player";

type VideoPlayerCardProps = {
  contentId?: string;
  coverImageUrl?: string;
  onHostedPlay?: () => void;
  onYoutubePlay?: () => void;
  onPlaybackIntent?: () => void;
  playLabel: string;
  source: VideoSource;
};

export function VideoPlayerCard({
  contentId,
  coverImageUrl,
  onHostedPlay,
  onYoutubePlay,
  onPlaybackIntent,
  playLabel,
  source,
}: VideoPlayerCardProps) {
  const { t } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const { isAuthenticated } = useConvexAuth();
  const { isMember } = useIsMember();
  const { enabledModules } = useAppTheme();
  const hostedVideoRef = useRef<VideoView>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [youtubeCurrentSeconds, setYoutubeCurrentSeconds] = useState(0);
  const [youtubeDurationSeconds, setYoutubeDurationSeconds] = useState(0);
  const player = useVideoPlayer(
    source.kind === "hosted" ? { uri: source.playbackUrl } : null,
  );

  const canSyncRemoteProgress =
    isAuthenticated &&
    isMember &&
    hasCapability(enabledModules, "progressSync");

  const { preferredResumeSeconds, saveFinal } = usePlaybackProgress({
    contentId: source.kind === "youtube" ? (contentId ?? null) : null,
    durationSeconds: youtubeDurationSeconds,
    persistableDurationSeconds:
      youtubeDurationSeconds > 0 ? youtubeDurationSeconds : undefined,
    currentSeconds: youtubeCurrentSeconds,
    canSyncRemote: canSyncRemoteProgress,
  });

  useEventListener(player, "playingChange", ({ isPlaying }) => {
    if (source.kind === "hosted" && isPlaying) {
      onPlaybackIntent?.();
    }
  });

  useEffect(() => {
    if (source.kind === "hosted" && hasStarted) {
      player.play();
    }
  }, [hasStarted, player, source.kind]);

  useEffect(() => {
    return () => {
      if (
        source.kind === "youtube" &&
        hasStarted &&
        youtubeCurrentSeconds > 0
      ) {
        saveFinal(youtubeCurrentSeconds);
      }
    };
  }, [hasStarted, saveFinal, source.kind, youtubeCurrentSeconds]);

  const startYoutubePlayback = () => {
    onPlaybackIntent?.();
    if (onYoutubePlay) {
      onYoutubePlay();
      return;
    }
    setHasStarted(true);
  };

  const handlePrimaryPlay = () => {
    void HapticsService.medium();
    if (source.kind === "hosted") {
      onPlaybackIntent?.();
      if (onHostedPlay) {
        onHostedPlay();
        return;
      }
      setHasStarted(true);
      return;
    }

    startYoutubePlayback();
  };

  if (source.kind === "youtube") {
    const youtubeVideoId = getYoutubeVideoId(source);
    const launchUrl = getYoutubeLaunchUrl(source);
    const playerHeight = Math.round((windowWidth * 9) / 16);

    if (!youtubeVideoId || !launchUrl) {
      return (
        <Text
          style={[
            styles.unavailable,
            { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
          ]}
        >
          {t("unavailable")}
        </Text>
      );
    }

    return (
      <View style={styles.card}>
        <View
          style={[
            styles.media,
            {
              backgroundColor: theme.colors.surfaceMuted,
            },
          ]}
        >
          {hasStarted ? (
            <YoutubePlayerSurface
              height={playerHeight}
              play={hasStarted}
              preferredResumeSeconds={preferredResumeSeconds}
              videoId={youtubeVideoId}
              onTimeUpdate={({ currentSeconds, durationSeconds }) => {
                setYoutubeCurrentSeconds(currentSeconds);
                if (durationSeconds > 0) {
                  setYoutubeDurationSeconds(durationSeconds);
                }
              }}
            />
          ) : coverImageUrl ? (
            <Image
              accessibilityLabel="Video cover"
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
            />
          ) : null}
        </View>

        {!hasStarted ? (
          <MediaHeroPlayBando
            accessibilityLabel={playLabel}
            onPress={handlePrimaryPlay}
            testID="video-play-button"
          />
        ) : null}

        {hasStarted ? (
          <View
            style={[
              styles.secondaryActions,
              {
                paddingHorizontal: theme.spacing.lg * scaleSpace,
                paddingTop: theme.spacing.md * scaleSpace,
                paddingBottom: theme.spacing.lg * scaleSpace,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void HapticsService.light();
                onPlaybackIntent?.();
                void WebBrowser.openBrowserAsync(launchUrl);
              }}
              style={({ pressed }) => [
                styles.linkButton,
                {
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: 18 * scaleSpace,
                  paddingVertical: 12 * scaleSpace,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.linkButtonText,
                  { color: theme.colors.accent, fontSize: 14 * scaleFont },
                ]}
              >
                {t("openExternal")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  const pipSupported = isPictureInPictureSupported();

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.media,
          {
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        {hasStarted ? (
          <VideoView
            allowsPictureInPicture
            contentFit="cover"
            nativeControls
            player={player}
            ref={hostedVideoRef}
            style={styles.videoView}
            testID="hosted-video-player"
          />
        ) : coverImageUrl ? (
          <Image
            accessibilityLabel="Video cover"
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
          />
        ) : null}
      </View>

      {!hasStarted ? (
        <MediaHeroPlayBando
          accessibilityLabel={playLabel}
          onPress={handlePrimaryPlay}
          testID="video-play-button"
        />
      ) : null}

      {hasStarted && pipSupported ? (
        <View
          style={[
            styles.secondaryActions,
            {
              paddingHorizontal: theme.spacing.lg * scaleSpace,
              paddingTop: theme.spacing.md * scaleSpace,
              paddingBottom: theme.spacing.lg * scaleSpace,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void HapticsService.light();
              void hostedVideoRef.current?.startPictureInPicture();
            }}
            style={({ pressed }) => [
              styles.linkButton,
              { backgroundColor: theme.colors.accentSoft },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.linkButtonText,
                { color: theme.colors.accent, fontSize: 14 * scaleFont },
              ]}
            >
              {t("enterPictureInPicture")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  media: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  secondaryActions: {},
  videoView: {
    width: "100%",
    height: "100%",
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  linkButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  unavailable: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.84,
  },
});
