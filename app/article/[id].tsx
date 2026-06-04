import { StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { PremiumPaywall } from "../../src/components/content/premium-paywall";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
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

  const premiumGate = content
    ? resolvePremiumGate({ isPremium: content.isPremium, isMember })
    : "open";

  const state =
    content && content.kind === "article"
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
        : content === undefined
      ? "loading"
      : content === null || content.kind !== "article"
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
            watermarkGlyph="✎"
            height={200 * scaleSpace}
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
              content.readingTimeMinutes
                ? t("readingTime", { minutes: content.readingTimeMinutes })
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
          ) : content.articleBody ? (
            <Text
              style={[
                styles.body,
                { color: theme.colors.text, fontSize: 16 * scaleFont, lineHeight: 26 * scaleFont },
              ]}
            >
              {content.articleBody}
            </Text>
          ) : null}
        </>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: fontFamilies.body },
});
