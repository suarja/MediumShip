import { Pressable, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { Link, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { EpisodeAudioPlayer } from "../../src/components/media/episode-audio-player";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
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

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;

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
            coverImageUrl={coverImageUrl}
            watermarkGlyph="▷"
            height={210 * scaleSpace}
            premiumLabel={content.isPremium ? t("premiumTag") : undefined}
          />
        ) : undefined
      }
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

          {content.isPremium ? (
            <View
              style={[
                styles.premiumCard,
                {
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.premiumSoft,
                  borderColor: theme.colors.premium,
                },
              ]}
            >
              <Text style={[styles.premiumTitle, { color: theme.colors.heading }]}>
                ★ {t("premiumTitle")}
              </Text>
              <Text style={[styles.premiumBody, { color: theme.colors.text }]}>
                {t("premiumBody")}
              </Text>
              <Link href="/sign-in" asChild>
                <Pressable
                  accessibilityRole="link"
                  style={{ alignSelf: "flex-start", paddingTop: 4 }}
                >
                  <Text style={[styles.premiumCta, { color: theme.colors.premium }]}>
                    {t("premiumCta")} →
                  </Text>
                </Pressable>
              </Link>
            </View>
          ) : content.audioUrl ? (
            <EpisodeAudioPlayer
              audioUrl={content.audioUrl}
              contentId={content._id}
              durationSeconds={content.durationSeconds}
              title={content.title}
            />
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
  premiumCard: {
    gap: 8,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
  },
  premiumTitle: { fontFamily: fontFamilies.displayBold, fontSize: 17 },
  premiumBody: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
  premiumCta: { fontFamily: fontFamilies.mono, fontSize: 13, letterSpacing: 0.5 },
  audioNote: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
