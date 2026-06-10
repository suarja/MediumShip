import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useEventListener } from "expo";
import {
  isPictureInPictureSupported,
  useVideoPlayer,
  VideoView,
} from "expo-video";
import { useTranslation } from "react-i18next";

import type { VideoSource } from "../../features/content/types";
import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { MediaHeroPlayBando } from "./media-hero-play-bando";

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
  const hostedVideoRef = useRef<VideoView>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const player = useVideoPlayer(
    source.kind === "hosted" ? { uri: source.playbackUrl } : null,
  );

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

    if (onYoutubePlay) {
      onYoutubePlay();
      return;
    }

    onPlaybackIntent?.();
  };

  if (source.kind === "youtube") {
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
          {coverImageUrl ? (
            <Image
              accessibilityLabel="Video cover"
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
            />
          ) : null}
        </View>

        <MediaHeroPlayBando
          accessibilityLabel={playLabel}
          onPress={handlePrimaryPlay}
          testID="video-play-button"
        />
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
  pressed: {
    opacity: 0.84,
  },
});
