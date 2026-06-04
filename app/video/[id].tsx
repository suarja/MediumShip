import { Pressable, StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { MemberGateCard } from "../../src/components/auth/member-gate-card";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { VideoPlayerCard } from "../../src/components/media/video-player-card";
import { usePersistentMediaPlayer } from "../../src/features/media/persistent-media-player";
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
  const { scaleSpace } = useResponsive();
  const { state: networkState } = useNetworkStatus();
  const router = useRouter();
  const { activeSession, closePlayer } = usePersistentMediaPlayer();

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
      hero={
        content ? (
          content.isPremium ? (
            <DetailHero
              key={content._id}
              coverImageUrl={coverImageUrl}
              mediaKey={content._id}
              watermarkGlyph="▶"
              height={200 * scaleSpace}
              playGlyph="▶"
              premiumLabel={t("premiumTag")}
            />
          ) : source?.kind === "youtube" ? (
            <VideoPlayerCard
              coverImageUrl={coverImageUrl}
              onPlaybackIntent={closePlayer}
              source={source}
            />
          ) : (
            <DetailHero
              key={content._id}
              coverImageUrl={coverImageUrl}
              mediaKey={content._id}
              watermarkGlyph="▶"
              height={200 * scaleSpace}
              playGlyph="▶"
            />
          )
        ) : undefined
      }
    >
      {content ? (
        <>
          <DetailHeader
            kicker={content.category || t("kicker")}
            title={content.title}
            meta={providerLabel ? t("providerLabel", { provider: providerLabel }) : undefined}
            lede={content.summary}
            premium={content.isPremium}
          />
          {content.isPremium ? (
            <MemberGateCard
              title={t("premiumTitle")}
              description={t("premiumBody")}
              ctaLabel={t("premiumCta")}
            />
          ) : source?.kind === "hosted" && activeSession?.contentId !== content._id ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push(`/player/${content._id}` as never);
              }}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: 12,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
                {t("playVideo")}
              </Text>
            </Pressable>
          ) : null}
          {!source ? (
            <Text style={[styles.unavailable, { color: theme.colors.textMuted }]}>
              {t("unavailable")}
            </Text>
          ) : null}
        </>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.84,
  },
  unavailable: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
