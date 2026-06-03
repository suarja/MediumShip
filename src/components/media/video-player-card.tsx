import { Pressable, StyleSheet, Text, View } from "react-native";

import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";

import {
  getYoutubeEmbedUrl,
} from "../../features/content/selectors";
import type { VideoSource } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type VideoPlayerCardProps = {
  source: VideoSource;
};

export function VideoPlayerCard({ source }: VideoPlayerCardProps) {
  const { t } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const player = useVideoPlayer(
    source.kind === "hosted" ? { uri: source.playbackUrl } : null,
  );

  if (source.kind === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(source);

    if (!embedUrl) {
      return (
        <Text style={[styles.unavailable, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
          {t("unavailable")}
        </Text>
      );
    }

    return (
      <View style={styles.wrapper}>
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
            mediaPlaybackRequiresUserAction
            source={{ uri: embedUrl }}
            style={styles.webview}
            testID="youtube-player"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => void WebBrowser.openBrowserAsync(source.youtubeUrl)}
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

  return (
    <View style={styles.wrapper}>
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
          style={styles.videoView}
          testID="hosted-video-player"
        />
      </View>
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
