import { StyleSheet, Text } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHero } from "../../src/components/content/detail-hero";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
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

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;

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
  const accentTone = content?.isPremium ? theme.colors.premium : theme.colors.accent;

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
          <Text style={[styles.kicker, { color: accentTone, fontSize: 11 * scaleFont }]}>
            {content.category || t("kicker")}
          </Text>
          <Text
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 28 * scaleFont, lineHeight: 32 * scaleFont },
            ]}
          >
            {content.title}
          </Text>
          {content.readingTimeMinutes ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
              {t("readingTime", { minutes: content.readingTimeMinutes })}
            </Text>
          ) : null}
          <Text
            style={[
              styles.lede,
              {
                color: theme.colors.text,
                borderTopColor: theme.colors.border,
                fontSize: 18 * scaleFont,
                lineHeight: 27 * scaleFont,
                paddingTop: theme.spacing.md * scaleSpace,
                marginTop: theme.spacing.xs * scaleSpace,
              },
            ]}
          >
            {content.summary}
          </Text>
          {content.articleBody ? (
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
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.displayBoldItalic, letterSpacing: -0.4 },
  meta: { fontFamily: fontFamilies.mono, letterSpacing: 0.4 },
  lede: {
    fontFamily: fontFamilies.display,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  body: { fontFamily: fontFamilies.body },
});
