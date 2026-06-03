import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import type { ContentDoc } from "../../src/features/content/types";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("article");
  const { theme } = useAppTheme();

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;

  const state =
    content === undefined
      ? "loading"
      : content === null || content.kind !== "article"
        ? "notFound"
        : "ready";

  return (
    <ContentDetailShell
      state={state}
      backLabel={t("back")}
      loadingLabel={t("loading")}
      notFoundTitle={t("notFoundTitle")}
      notFoundBody={t("notFoundBody")}
    >
      {content ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.cover, { backgroundColor: theme.colors.accent }]} />
          <Text
            style={[
              styles.kicker,
              { color: content.isPremium ? theme.colors.premium : theme.colors.accent },
            ]}
          >
            {content.category || t("kicker")}
          </Text>
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {content.title}
          </Text>
          {content.readingTimeMinutes ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {t("readingTime", { minutes: content.readingTimeMinutes })}
            </Text>
          ) : null}
          <Text style={[styles.summary, { color: theme.colors.text }]}>
            {content.summary}
          </Text>
          {content.articleBody ? (
            <Text style={[styles.body, { color: theme.colors.text }]}>
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
  summary: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 26 },
});
