import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
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
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {coverImageUrl ? (
            <Image
              accessibilityLabel={`${content.title} cover`}
              source={{ uri: coverImageUrl }}
              style={[styles.cover, { height: 160 * scaleSpace }]}
            />
          ) : (
            <View
              style={[
                styles.cover,
                { backgroundColor: theme.colors.accent, height: 160 * scaleSpace },
              ]}
            />
          )}
          <Text
            style={[
              styles.kicker,
              {
                color: content.isPremium ? theme.colors.premium : theme.colors.accent,
                fontSize: 11 * scaleFont,
              },
            ]}
          >
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
          {content.readingTimeMinutes ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
              {t("readingTime", { minutes: content.readingTimeMinutes })}
            </Text>
          ) : null}
          <Text
            style={[styles.summary, { color: theme.colors.text, fontSize: 16 * scaleFont, lineHeight: 24 * scaleFont }]}
          >
            {content.summary}
          </Text>
          {content.articleBody ? (
            <Text
              style={[styles.body, { color: theme.colors.text, fontSize: 16 * scaleFont, lineHeight: 26 * scaleFont }]}
            >
              {content.articleBody}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10, paddingBottom: 32 },
  cover: { height: 160, borderRadius: 18, marginBottom: 6 },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34 },
  meta: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 0.4 },
  summary: { fontFamily: fontFamilies.bodySemiBold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 26 },
});
