import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { DegradedBanner } from "../../src/components/content/degraded-banner";
import { FeedCard } from "../../src/components/content/feed-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentEpisodePlayerSpace } from "../../src/features/media/persistent-episode-player";
import { filterAndOrderFeedContent } from "../../src/features/tenant/public-config";
import { toContentCardModel } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function HomeFeedScreen() {
  const { t } = useTranslation("home");
  const { theme, tenantSlug, enabledModules, feedSections } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentEpisodePlayerSpace();
  const { state: networkState } = useNetworkStatus();

  const contents = useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug,
  }) as ContentDoc[] | undefined;

  const items = filterAndOrderFeedContent(
    contents ?? [],
    enabledModules,
    feedSections,
  ).map(toContentCardModel);
  const isLoading = contents === undefined;
  const [featured, ...rest] = items;

  return (
    <Screen>
      <DegradedBanner state={networkState} />
      <View
        style={[
          styles.header,
          { gap: theme.spacing.xs * scaleSpace, marginBottom: theme.spacing.xl * scaleSpace },
        ]}
      >
        <Text
          style={[styles.eyebrow, { color: theme.colors.accent, fontSize: 11 * scaleFont }]}
        >
          {t("eyebrow")}
        </Text>
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontSize: 30 * scaleFont, lineHeight: 35 * scaleFont },
          ]}
        >
          {t("feedTitle")}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.textMuted, fontSize: 15 * scaleFont }]}
        >
          {t("feedSubtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.list,
          {
            gap: theme.spacing.sm * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.heading }]}>
              {isLoading
                ? networkState === "offline"
                  ? t("offlineTitle")
                  : t("loadingTitle")
                : t("emptyTitle")}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
              {isLoading
                ? networkState === "offline"
                  ? t("offlineBody")
                  : t("loadingBody")
                : t("emptyBody")}
            </Text>
          </View>
        ) : (
          <>
            {featured ? <FeedCard item={featured} featured /> : null}
            {rest.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 16 },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontSize: 30, lineHeight: 35 },
  subtitle: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 21 },
  scroll: { flex: 1 },
  list: { gap: 12, paddingBottom: 24 },
  empty: { gap: 8, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  emptyTitle: { fontFamily: fontFamilies.display, fontSize: 18 },
  emptyBody: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
});
