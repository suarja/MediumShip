import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { VideoPlayerCard } from "../../src/components/media/video-player-card";
import {
  usePersistentEpisodePlayer,
  usePersistentEpisodePlayerSpace,
} from "../../src/features/media/persistent-episode-player";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const { state: networkState } = useNetworkStatus();
  const { closePlayer } = usePersistentEpisodePlayer();
  const persistentPlayerSpace = usePersistentEpisodePlayerSpace();

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;

  const state =
    content && content.kind === "video"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
        : content === undefined
      ? "loading"
      : content === null || content.kind !== "video"
        ? "notFound"
        : "ready";

  const source = content?.videoSource;
  const coverImageUrl = content ? getContentCoverImageUrl(content) : undefined;
  const providerLabel =
    source?.kind === "youtube"
      ? t("youtubeProvider")
      : source?.kind === "hosted"
        ? t("hostedProvider")
        : null;

  return (
    <ContentDetailShell
      state={state}
      networkState={networkState}
      backLabel={t("back")}
      loadingLabel={t("loading")}
      offlineTitle={t("offlineTitle")}
      offlineBody={t("offlineBody")}
      notFoundTitle={t("notFoundTitle")}
      notFoundBody={t("notFoundBody")}
    >
      {content ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 32 + persistentPlayerSpace },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {source ? (
            <VideoPlayerCard onPlaybackIntent={closePlayer} source={source} />
          ) : coverImageUrl ? (
            <Image
              accessibilityLabel={`${content.title} cover`}
              source={{ uri: coverImageUrl }}
              style={[styles.cover, { height: 180 * scaleSpace }]}
            />
          ) : (
            <View
              style={[
                styles.cover,
                { backgroundColor: theme.colors.accent, height: 180 * scaleSpace },
              ]}
            >
              <Text
                style={[styles.playGlyph, { color: theme.colors.accentContrast, fontSize: 40 * scaleFont }]}
              >
                ▶
              </Text>
            </View>
          )}
          <Text style={[styles.kicker, { color: theme.colors.accent, fontSize: 11 * scaleFont }]}>
            {content.category || t("kicker")}
          </Text>
          <Text
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 28 * scaleFont, lineHeight: 34 * scaleFont },
            ]}
          >
            {content.title}
          </Text>
          {providerLabel ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
              {t("providerLabel", { provider: providerLabel })}
            </Text>
          ) : null}
          <Text
            style={[styles.summary, { color: theme.colors.text, fontSize: 16 * scaleFont, lineHeight: 24 * scaleFont }]}
          >
            {content.summary}
          </Text>
          {!source ? (
            <Text style={[styles.unavailable, { color: theme.colors.textMuted }]}>
              {t("unavailable")}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10 },
  cover: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  playGlyph: { color: "#FFFFFF", fontSize: 40, opacity: 0.85 },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34 },
  meta: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 0.4 },
  summary: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24 },
  unavailable: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
