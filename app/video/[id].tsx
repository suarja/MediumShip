import { Pressable, StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentActionsBar } from "../../src/components/content/content-actions-bar";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { PremiumPaywall } from "../../src/components/content/premium-paywall";
import { VideoPlayerCard } from "../../src/components/media/video-player-card";
import { usePersistentMediaPlayer } from "../../src/features/media/persistent-media-player";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { resolvePremiumGate } from "../../src/features/membership/premium-gate";
import { useIsMember } from "../../src/features/membership/use-is-member";
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
  const { isMember } = useIsMember();

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;
  const { downloadedItem } = useDownloads({ contentId: id, enabled: isMember });
  const resolvedContent = content ?? downloadedItem?.content ?? null;

  const premiumGate = resolvedContent
    ? resolvePremiumGate({ isPremium: resolvedContent.isPremium, isMember })
    : "open";

  const state =
    resolvedContent && resolvedContent.kind === "video"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
      : content === undefined
      ? "loading"
      : resolvedContent === null || resolvedContent.kind !== "video"
        ? "notFound"
        : "ready";

  const source = resolvedContent?.videoSource;
  const coverImageUrl =
    downloadedItem?.localCoverImagePath ??
    (resolvedContent ? getContentCoverImageUrl(resolvedContent) : undefined);
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
        resolvedContent ? (
          premiumGate === "locked" ? (
            <DetailHero
              key={resolvedContent._id}
              coverImageUrl={coverImageUrl}
              mediaKey={resolvedContent._id}
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
              key={resolvedContent._id}
              coverImageUrl={coverImageUrl}
              mediaKey={resolvedContent._id}
              watermarkGlyph="▶"
              height={200 * scaleSpace}
              playGlyph="▶"
            />
          )
        ) : undefined
      }
      actions={
        resolvedContent && premiumGate !== "locked" ? (
          <ContentActionsBar content={resolvedContent} />
        ) : undefined
      }
    >
      {resolvedContent ? (
        <>
          <DetailHeader
            kicker={resolvedContent.category || t("kicker")}
            title={resolvedContent.title}
            meta={providerLabel ? t("providerLabel", { provider: providerLabel }) : undefined}
            lede={resolvedContent.summary}
            premium={resolvedContent.isPremium}
          />
          {premiumGate === "locked" ? (
            <PremiumPaywall
              title={t("premiumTitle")}
              description={t("premiumBody")}
              ctaLabel={t("premiumCta")}
            />
          ) : source?.kind === "hosted" || downloadedItem?.localMediaPath ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push(`/player/${resolvedContent._id}` as never);
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
                {activeSession?.contentId === resolvedContent._id
                  ? t("resumeVideo")
                  : t("playVideo")}
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
