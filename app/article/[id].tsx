import { StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ContentActionsBar } from "../../src/components/content/content-actions-bar";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { ContentSourceAttribution } from "../../src/components/content/content-source-attribution";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { PremiumPaywall } from "../../src/components/content/premium-paywall";
import { resolveContentSource } from "../../src/features/content/source";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { useContentEngagement } from "../../src/features/discovery/use-content-engagement";
import { resolvePremiumGate } from "../../src/features/membership/premium-gate";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("article");
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const { state: networkState } = useNetworkStatus();
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
    resolvedContent && resolvedContent.kind === "article"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
      : content === undefined
      ? "loading"
      : resolvedContent === null || resolvedContent.kind !== "article"
        ? "notFound"
        : "ready";
  const coverImageUrl =
    downloadedItem?.localCoverImagePath ??
    (resolvedContent ? getContentCoverImageUrl(resolvedContent) : undefined);
  const contentSource = resolvedContent
    ? resolveContentSource(resolvedContent)
    : "cms";
  const isWikipedia = contentSource === "wikipedia";
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [dwellSeconds, setDwellSeconds] = useState(0);

  useEffect(() => {
    setScrolledToEnd(false);
    setDwellSeconds(0);
  }, [resolvedContent?._id]);

  useEffect(() => {
    if (state !== "ready" || !resolvedContent) {
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      setDwellSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [resolvedContent?._id, state]);

  useContentEngagement({
    contentId: resolvedContent?._id as Id<"contents"> | undefined,
    kind: "article",
    enabled: state === "ready" && premiumGate !== "locked",
    consumption: {
      scrolledToEnd,
      dwellSeconds,
      estimatedReadMinutes: resolvedContent?.readingTimeMinutes,
    },
  });

  const handleScroll = useCallback(
    (event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const nearEnd =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 48;
      if (nearEnd) {
        setScrolledToEnd(true);
      }
    },
    [],
  );

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
      onScroll={handleScroll}
      hero={
        resolvedContent ? (
          <DetailHero
            coverImageUrl={coverImageUrl}
            watermarkGlyph="✎"
            height={200 * scaleSpace}
            premiumLabel={resolvedContent.isPremium ? t("premiumTag") : undefined}
          />
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
            kicker={
              isWikipedia
                ? t("sourceWikipedia")
                : resolvedContent.category || t("kicker")
            }
            title={resolvedContent.title}
            meta={
              resolvedContent.readingTimeMinutes
                ? t("readingTime", { minutes: resolvedContent.readingTimeMinutes })
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
          ) : (
            <>
              {isWikipedia ? (
                <ContentSourceAttribution
                  source={contentSource}
                  canonicalUrl={resolvedContent.canonicalUrl}
                  showExtractNote
                />
              ) : null}
              {resolvedContent.articleBody ? (
                <Text
                  style={[
                    styles.body,
                    {
                      color: theme.colors.text,
                      fontSize: 16 * scaleFont,
                      lineHeight: 26 * scaleFont,
                    },
                  ]}
                >
                  {resolvedContent.articleBody}
                </Text>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: fontFamilies.body },
});
