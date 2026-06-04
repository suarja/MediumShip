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
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { resolvePremiumGate } from "../../src/features/membership/premium-gate";
import { useIsMember } from "../../src/features/membership/use-is-member";
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

  const premiumGate = content
    ? resolvePremiumGate({ isPremium: content.isPremium, isMember })
    : "open";

  const state =
    content && content.kind === "episode"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
        : content === undefined
      ? "loading"
      : content === null || content.kind !== "episode"
        ? "notFound"
        : "ready";
  const coverImageUrl = content ? getContentCoverImageUrl(content) : undefined;

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
          <DetailHero
            key={content._id}
            coverImageUrl={coverImageUrl}
            mediaKey={content._id}
            watermarkGlyph="▷"
            height={210 * scaleSpace}
            premiumLabel={content.isPremium ? t("premiumTag") : undefined}
          />
        ) : undefined
      }
      actions={content ? <ContentActionsBar content={content} /> : undefined}
    >
      {content ? (
        <>
          <DetailHeader
            kicker={content.category || t("kicker")}
            title={content.title}
            meta={
              content.durationSeconds
                ? t("duration", { minutes: Math.round(content.durationSeconds / 60) })
                : undefined
            }
            lede={content.summary}
            premium={content.isPremium}
          />

          {premiumGate === "locked" ? (
            <PremiumPaywall
              title={t("premiumTitle")}
              description={t("premiumBody")}
              ctaLabel={t("premiumCta")}
            />
          ) : content.audioUrl ? (
            activeSession?.contentId === content._id ? null : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push(`/player/${content._id}` as never);
              }}
              style={({ pressed }) => [
                styles.playbackButton,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: 12,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.playbackLabel, { color: theme.colors.accentContrast }]}>
                {t("playerLabel")}
              </Text>
            </Pressable>
            )
          ) : (
            <Text style={[styles.audioNote, { color: theme.colors.textMuted }]}>
              {t("audioNote")}
            </Text>
          )}
        </>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  playbackButton: {
    minHeight: 52,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  playbackLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
  },
  audioNote: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
