import { StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ContentActionsBar } from "../../src/components/content/content-actions-bar";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { EpisodePlayerCard } from "../../src/components/media/episode-player-card";
import { PremiumPaywall } from "../../src/components/content/premium-paywall";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { useContentEngagement } from "../../src/features/discovery/use-content-engagement";
import { resolvePremiumGate } from "../../src/features/membership/premium-gate";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { HapticsService } from "../../src/features/haptics/haptics";
import { usePersistentMediaPlayer } from "../../src/features/media/persistent-media-player";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const { state: networkState } = useNetworkStatus();
  const router = useRouter();
  const { activeSession } = usePersistentMediaPlayer();
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
    resolvedContent && resolvedContent.kind === "episode"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
      : content === undefined
      ? "loading"
      : resolvedContent === null || resolvedContent.kind !== "episode"
        ? "notFound"
        : "ready";
  const coverImageUrl =
    downloadedItem?.localCoverImagePath ??
    (resolvedContent ? getContentCoverImageUrl(resolvedContent) : undefined);
  const hasPlayableAudio = Boolean(
    resolvedContent?.audioUrl || downloadedItem?.localMediaPath,
  );
  const playLabel =
    activeSession?.contentId === resolvedContent?._id
      ? t("resumeEpisode")
      : t("playEpisode");

  useContentEngagement({
    contentId: resolvedContent?._id as Id<"contents"> | undefined,
    kind: "episode",
    enabled: state === "ready" && premiumGate !== "locked",
  });

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
              watermarkGlyph="▷"
              height={210 * scaleSpace}
              premiumLabel={t("premiumTag")}
            />
          ) : hasPlayableAudio ? (
            <EpisodePlayerCard
              coverImageUrl={coverImageUrl}
              onPlay={() => {
                void HapticsService.medium();
                router.push(`/player/${resolvedContent._id}` as never);
              }}
              playLabel={playLabel}
            />
          ) : (
            <DetailHero
              key={resolvedContent._id}
              coverImageUrl={coverImageUrl}
              mediaKey={resolvedContent._id}
              watermarkGlyph="▷"
              height={210 * scaleSpace}
              premiumLabel={resolvedContent.isPremium ? t("premiumTag") : undefined}
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
            meta={
              resolvedContent.durationSeconds
                ? t("duration", { minutes: Math.round(resolvedContent.durationSeconds / 60) })
                : undefined
            }
            lede={resolvedContent.summary}
            premium={resolvedContent.isPremium}
          />

          {premiumGate === "locked" ? (
            <PremiumPaywall
              title={t("premiumTitle")}
              description={t("premiumBody")}
              ctaLabel={t("premiumCta")}
            />
          ) : !hasPlayableAudio ? (
            <Text style={[styles.audioNote, { color: theme.colors.textMuted }]}>
              {t("audioNote")}
            </Text>
          ) : null}
        </>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  audioNote: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
