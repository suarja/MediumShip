import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { Link, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import type { ContentDoc } from "../../src/features/content/types";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("episode");
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;

  const state =
    content === undefined
      ? "loading"
      : content === null || content.kind !== "episode"
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
          <View
            style={[
              styles.cover,
              { backgroundColor: theme.colors.accent, height: 160 * scaleSpace },
            ]}
          >
            <View style={styles.coverGlow} />
          </View>
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
          {content.durationSeconds ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
              {t("duration", {
                minutes: Math.round(content.durationSeconds / 60),
              })}
            </Text>
          ) : null}
          <Text
            style={[styles.summary, { color: theme.colors.text, fontSize: 16 * scaleFont, lineHeight: 24 * scaleFont }]}
          >
            {content.summary}
          </Text>

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
                <Text style={[styles.premiumCta, { color: theme.colors.premium }]}>
                  {t("premiumCta")} →
                </Text>
              </Link>
            </View>
          ) : (
            <Text style={[styles.audioNote, { color: theme.colors.textMuted }]}>
              {t("audioNote")}
            </Text>
          )}
        </ScrollView>
      ) : null}
    </ContentDetailShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10, paddingBottom: 32 },
  cover: {
    height: 160,
    borderRadius: 18,
    marginBottom: 6,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  coverGlow: {
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: "rgba(0, 0, 0, 0.16)",
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34 },
  meta: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 0.4 },
  summary: { fontSize: 16, lineHeight: 24 },
  premiumCard: {
    gap: 8,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
  },
  premiumTitle: { fontSize: 17, fontWeight: "700" },
  premiumBody: { fontSize: 15, lineHeight: 22 },
  premiumCta: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    letterSpacing: 0.5,
    paddingTop: 4,
  },
  audioNote: { fontSize: 14, lineHeight: 20, marginTop: 4 },
});
