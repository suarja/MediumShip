import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import {
  FeedFilterChips,
  type FeedFilter,
  type FeedFilterChip,
} from "../../src/components/content/feed-filter-chips";
import { FeedHeroCard } from "../../src/components/content/feed-hero-card";
import { FeedRow } from "../../src/components/content/feed-row";
import { StatusBannerStack } from "../../src/components/content/status-banner-stack";
import { Screen } from "../../src/components/layout/screen";
import { BrandHeader } from "../../src/components/navigation/brand-header";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { cardKicker, cardMeta } from "../../src/features/content/card-presentation";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { toContentCardModel } from "../../src/features/content/selectors";
import type { ContentDoc, ContentKind } from "../../src/features/content/types";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import {
  filterAndOrderFeedContent,
  moduleToContentKind,
} from "../../src/features/tenant/public-config";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const CHIP_LABEL_KEY: Record<ContentKind, string> = {
  article: "chipArticles",
  episode: "chipEpisodes",
  video: "chipVideos",
};

export default function HomeFeedScreen() {
  const { t } = useTranslation("home");
  const { theme, tenantSlug, enabledModules, feedSections } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const { state: networkState } = useNetworkStatus();
  const [filter, setFilter] = useState<FeedFilter>("all");

  const contents = useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug,
  }) as ContentDoc[] | undefined;

  const allItems = useMemo(
    () =>
      filterAndOrderFeedContent(contents ?? [], enabledModules, feedSections).map(
        toContentCardModel,
      ),
    [contents, enabledModules, feedSections],
  );

  const chips = useMemo<FeedFilterChip[]>(() => {
    const formatChips = enabledModules
      .filter((module): module is Exclude<typeof module, "premium"> => module !== "premium")
      .map((module) => {
        const kind = moduleToContentKind(module);
        return { key: kind, label: t(CHIP_LABEL_KEY[kind]) } satisfies FeedFilterChip;
      });
    return [{ key: "all", label: t("chipAll") }, ...formatChips];
  }, [enabledModules, t]);

  const visibleItems =
    filter === "all" ? allItems : allItems.filter((item) => item.kind === filter);
  const [featured, ...rest] = visibleItems;

  const isLoading = contents === undefined;
  const sectionTitle =
    filter === "all"
      ? t("sectionFeed")
      : (chips.find((chip) => chip.key === filter)?.label ?? t("sectionFeed"));

  return (
    <Screen>
      <StatusBannerStack networkState={networkState} />
      <BrandHeader />
      <View style={{ marginBottom: theme.spacing.lg * scaleSpace }}>
        <FeedFilterChips chips={chips} active={filter} onSelect={setFilter} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarSpace + persistentPlayerSpace }}
        showsVerticalScrollIndicator={false}
      >
        {visibleItems.length === 0 ? (
          <EmptyState
            isLoading={isLoading}
            isOffline={networkState === "offline"}
            hasAnyContent={allItems.length > 0}
          />
        ) : (
          <>
            {featured ? (
              <FeedHeroCard
                item={featured}
                kicker={cardKicker(featured, t)}
                meta={cardMeta(featured, t)}
              />
            ) : null}

            {rest.length > 0 ? (
              <>
                <View
                  style={[
                    styles.sectionHeader,
                    {
                      marginTop: theme.spacing.xl * scaleSpace,
                      marginBottom: theme.spacing.xs * scaleSpace,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.heading, fontSize: 18 * scaleFont },
                    ]}
                  >
                    {sectionTitle}
                  </Text>
                </View>

                {rest.map((item, index) => (
                  <FeedRow
                    key={item.id}
                    item={item}
                    kicker={cardKicker(item, t)}
                    meta={cardMeta(item, t)}
                    divider={index > 0}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function EmptyState({
  isLoading,
  isOffline,
  hasAnyContent,
}: {
  isLoading: boolean;
  isOffline: boolean;
  hasAnyContent: boolean;
}) {
  const { t } = useTranslation("home");
  const { theme } = useAppTheme();

  const titleKey = isLoading
    ? isOffline
      ? "offlineTitle"
      : "loadingTitle"
    : hasAnyContent
      ? "filterEmptyTitle"
      : "emptyTitle";
  const bodyKey = isLoading
    ? isOffline
      ? "offlineBody"
      : "loadingBody"
    : hasAnyContent
      ? "filterEmptyBody"
      : "emptyBody";

  return (
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
      <Text style={[styles.emptyTitle, { color: theme.colors.heading }]}>{t(titleKey)}</Text>
      <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>{t(bodyKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: fontFamilies.display, letterSpacing: -0.2 },
  empty: { gap: 8, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  emptyTitle: { fontFamily: fontFamilies.display, fontSize: 18 },
  emptyBody: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
});
