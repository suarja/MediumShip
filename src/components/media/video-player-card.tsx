import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useEventListener } from "expo";
import {
  isPictureInPictureSupported,
  useVideoPlayer,
  VideoView,
} from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";

import {
  getYoutubeEmbedUrl,
  getYoutubeLaunchUrl,
} from "../../features/content/selectors";
import type { VideoSource } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { env } from "../../lib/env";

type VideoPlayerCardProps = {
  coverImageUrl?: string;
  onPlaybackIntent?: () => void;
  source: VideoSource;
};

const youtubeRefererUrl =
  env.EXPO_PUBLIC_EMBED_REFERER_URL ??
  env.EXPO_PUBLIC_CONVEX_SITE_URL ??
  "https://mediumship.app";

export function VideoPlayerCard({
  coverImageUrl,
  onPlaybackIntent,
  source,
}: VideoPlayerCardProps) {
  const { t } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
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

  const startPlayback = () => {
    onPlaybackIntent?.();
    setHasStarted(true);
  };

  if (source.kind === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(source);
    const launchUrl = getYoutubeLaunchUrl(source);

    if (!embedUrl || !launchUrl) {
      return (
        <Text style={[styles.unavailable, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
          {t("unavailable")}
        </Text>
      );
    }

    const startedEmbedUrl = new URL(embedUrl);
    if (hasStarted) {
      startedEmbedUrl.searchParams.set("autoplay", "1");
    }

    return (
      <View style={styles.wrapper}>
        {hasStarted ? (
          <View
            style={[
              styles.playerSurface,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
              },
            ]}
          >
            <WebView
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              source={{
                uri: startedEmbedUrl.toString(),
                headers: {
                  Referer: youtubeRefererUrl,
                },
              }}
              style={styles.webview}
              testID="youtube-player"
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startPlayback}
            style={({ pressed }) => [
              styles.previewSurface,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
              },
              pressed && styles.pressed,
            ]}
            testID="video-start-button"
          >
            {coverImageUrl ? (
              <Image
                accessibilityLabel="Video cover"
                source={{ uri: coverImageUrl }}
                style={styles.previewImage}
              />
            ) : null}
            <View
              style={[
                styles.previewOverlay,
                { backgroundColor: theme.colors.overlay },
              ]}
            />
            <Text
              style={[
                styles.previewPlay,
                { color: theme.colors.accentContrast, fontSize: 42 * scaleFont },
              ]}
            >
              ▶
            </Text>
            <Text
              style={[
                styles.previewLabel,
                { color: theme.colors.accentContrast, fontSize: 14 * scaleFont },
              ]}
            >
              {t("playVideo")}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onPlaybackIntent?.();
            void WebBrowser.openBrowserAsync(launchUrl);
          }}
          style={({ pressed }) => [
            styles.linkButton,
            {
              backgroundColor: theme.colors.accentSoft,
              borderRadius: theme.radii.pill,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.linkButtonText, { color: theme.colors.accent, fontSize: 14 * scaleFont }]}>
            {t("openExternal")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const pipSupported = isPictureInPictureSupported();

  return (
    <View style={styles.wrapper}>
      {hasStarted ? (
        <View
          style={[
            styles.playerSurface,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
            },
          ]}
        >
          <VideoView
            allowsPictureInPicture
            contentFit="cover"
            nativeControls
            player={player}
            ref={hostedVideoRef}
            style={styles.videoView}
            testID="hosted-video-player"
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={startPlayback}
          style={({ pressed }) => [
            styles.previewSurface,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
            },
            pressed && styles.pressed,
          ]}
          testID="video-start-button"
        >
          {coverImageUrl ? (
            <Image
              accessibilityLabel="Video cover"
              source={{ uri: coverImageUrl }}
              style={styles.previewImage}
            />
          ) : null}
          <View
            style={[
              styles.previewOverlay,
              { backgroundColor: theme.colors.overlay },
            ]}
          />
          <Text
            style={[
              styles.previewPlay,
              { color: theme.colors.accentContrast, fontSize: 42 * scaleFont },
            ]}
          >
            ▶
          </Text>
          <Text
            style={[
              styles.previewLabel,
              { color: theme.colors.accentContrast, fontSize: 14 * scaleFont },
            ]}
          >
            {t("playVideo")}
          </Text>
        </Pressable>
      )}
      {hasStarted && pipSupported ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void hostedVideoRef.current?.startPictureInPicture()}
          style={({ pressed }) => [
            styles.linkButton,
            {
              backgroundColor: theme.colors.accentSoft,
              borderRadius: theme.radii.pill,
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
            {t("enterPictureInPicture")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  playerSurface: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
    borderWidth: 1,
  },
  previewSurface: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  previewPlay: {
    fontWeight: "700",
    opacity: 0.95,
  },
  previewLabel: {
    marginTop: 8,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
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
