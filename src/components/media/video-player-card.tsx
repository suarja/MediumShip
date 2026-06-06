import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
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
  onHostedPlay?: () => void;
  onPlaybackIntent?: () => void;
  playLabel: string;
  source: VideoSource;
};

const youtubeRefererUrl =
  env.EXPO_PUBLIC_EMBED_REFERER_URL ??
  env.EXPO_PUBLIC_CONVEX_SITE_URL ??
  "https://mediumship.app";

function buildYoutubeEmbedHtml(embedUrl: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
    />
    <meta name="referrer" content="origin" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${embedUrl}"
      title="YouTube player"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}

export function VideoPlayerCard({
  coverImageUrl,
  onHostedPlay,
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

  const startYoutubePlayback = () => {
    onPlaybackIntent?.();
    setHasStarted(true);
  };

  const handlePrimaryPlay = () => {
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
    const youtubeEmbedHtml = buildYoutubeEmbedHtml(startedEmbedUrl.toString());

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
            <WebView
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              source={{
                html: youtubeEmbedHtml,
                baseUrl: youtubeRefererUrl,
              }}
              style={styles.webview}
              testID="youtube-player"
            />
          ) : coverImageUrl ? (
            <Image
              accessibilityLabel="Video cover"
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
            />
          ) : null}
        </View>

        <VideoControlBando
          onPrimaryPlay={handlePrimaryPlay}
          playLabel={playLabel}
          scaleFont={scaleFont}
          scaleSpace={scaleSpace}
          showPrimaryPlay={!hasStarted}
        />

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
              <Text style={[styles.linkButtonText, { color: theme.colors.accent, fontSize: 14 * scaleFont }]}>
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

      <VideoControlBando
        onPrimaryPlay={handlePrimaryPlay}
        playLabel={playLabel}
        scaleFont={scaleFont}
        scaleSpace={scaleSpace}
        showPrimaryPlay={!hasStarted}
      />

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
            onPress={() => void hostedVideoRef.current?.startPictureInPicture()}
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

function VideoControlBando({
  onPrimaryPlay,
  playLabel,
  scaleFont,
  scaleSpace,
  showPrimaryPlay,
}: {
  onPrimaryPlay: () => void;
  playLabel: string;
  scaleFont: number;
  scaleSpace: number;
  showPrimaryPlay: boolean;
}) {
  const { theme } = useAppTheme();
  const bandoBg = theme.isDark ? theme.colors.canvasAccent : theme.colors.heading;
  const playIconSize = 22 * scaleFont;

  if (!showPrimaryPlay) {
    return null;
  }

  return (
    <View
      style={[
        styles.bando,
        {
          backgroundColor: bandoBg,
          paddingHorizontal: theme.spacing.md * scaleSpace,
          paddingVertical: 10 * scaleSpace,
        },
      ]}
    >
      <Pressable
        accessibilityLabel={playLabel}
        accessibilityRole="button"
        onPress={onPrimaryPlay}
        style={({ pressed }) => [
          styles.playIconButton,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radii.pill,
          },
          pressed && styles.pressed,
        ]}
        testID="video-play-button"
      >
        <Ionicons
          color={theme.colors.accentContrast}
          name="play"
          size={playIconSize}
          style={styles.playIconGlyph}
        />
      </Pressable>
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
  bando: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  playIconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  playIconGlyph: {
    marginLeft: 2,
  },
  secondaryActions: {},
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
