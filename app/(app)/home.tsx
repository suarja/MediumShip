import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useQuery } from "convex/react";
import { usePushWithReturn } from "../../src/features/navigation/app-navigation";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { SearchBar } from "../../src/components/search/search-bar";
import {
  FeedFilterChips,
  type FeedFilter,
  type FeedFilterChip,
} from "../../src/components/content/feed-filter-chips";
import { FeedHeroCard } from "../../src/components/content/feed-hero-card";
import { FeedRow } from "../../src/components/content/feed-row";
import { FeedSkeleton } from "../../src/components/content/feed-skeleton";
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
  getVisibleFeedSections,
  groupFeedContentBySection,
  isDefaultFeedSectionTitle,
  moduleToContentKind,
  type ContentModule,
  type FeedSectionConfig,
} from "../../src/features/tenant/public-config";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const CHIP_LABEL_KEY: Record<
  ContentKind,
  "chipArticles" | "chipEpisodes" | "chipVideos"
> = {
  article: "chipArticles",
  episode: "chipEpisodes",
  video: "chipVideos",
};

function resolveFeedSectionTitle(
  section: FeedSectionConfig,
  t: (key: "chipArticles" | "chipEpisodes" | "chipVideos") => string,
): string {
  if (isDefaultFeedSectionTitle(section.kind, section.title)) {
    return t(CHIP_LABEL_KEY[section.kind]);
  }

  return section.title;
}

export default function HomeFeedScreen() {
  const { t } = useTranslation("home");
  const { theme, tenantSlug, enabledModules, feedSections } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const { state: networkState } = useNetworkStatus();
  const pushWithReturn = usePushWithReturn();
  const { t: tSearch } = useTranslation("explore");
  const [filter, setFilter] = useState<FeedFilter>("all");

  const contents = useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug,
  }) as ContentDoc[] | undefined;

  const sectionGroups = useMemo(
    () =>
      groupFeedContentBySection(contents ?? [], enabledModules, feedSections).map(
        (group) => ({
          ...group,
          items: group.items.map(toContentCardModel),
        }),
      ),
    [contents, enabledModules, feedSections],
  );

  const allItems = useMemo(
    () =>
      filterAndOrderFeedContent(contents ?? [], enabledModules, feedSections).map(
        toContentCardModel,
      ),
    [contents, enabledModules, feedSections],
  );

  const chips = useMemo<FeedFilterChip[]>(() => {
    const visibleSections = getVisibleFeedSections(feedSections, enabledModules);
    const formatChips = visibleSections.map((section) => ({
      key: section.kind,
      label: resolveFeedSectionTitle(section, t),
    })) as FeedFilterChip[];

    if (formatChips.length === 0) {
      const fallbackChips = enabledModules
        .filter((module): module is ContentModule =>
          module === "articles" || module === "episodes" || module === "videos",
        )
        .map((module) => {
          const kind = moduleToContentKind(module);
          return { key: kind, label: t(CHIP_LABEL_KEY[kind]) } satisfies FeedFilterChip;
        });
      return [{ key: "all", label: t("chipAll") }, ...fallbackChips];
    }

    return [{ key: "all", label: t("chipAll") }, ...formatChips];
  }, [enabledModules, feedSections, t]);

  const filteredSections =
    filter === "all"
      ? sectionGroups
      : sectionGroups.filter((group) => group.section.kind === filter);

  const isLoading = contents === undefined;
  const hasAnyContent = allItems.length > 0;

  return (
    <Screen>
      <StatusBannerStack networkState={networkState} />
      <BrandHeader />
      <View style={{ marginBottom: theme.spacing.md * scaleSpace }}>
        <SearchBar
          testID="home-search"
          placeholder={tSearch("searchPlaceholder")}
          onPress={() => pushWithReturn("/explore")}
        />
      </View>
      <View style={{ marginBottom: theme.spacing.lg * scaleSpace }}>
        <FeedFilterChips chips={chips} active={filter} onSelect={setFilter} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarSpace + persistentPlayerSpace }}
        showsVerticalScrollIndicator={false}
      >
        {filteredSections.every((group) => group.items.length === 0) ? (
          isLoading && networkState !== "offline" ? (
            <FeedSkeleton testID="home-loading" />
          ) : (
            <EmptyState
              isLoading={isLoading}
              isOffline={networkState === "offline"}
              hasAnyContent={hasAnyContent}
            />
          )
        ) : (
          filteredSections.map((group, groupIndex) => {
            if (group.items.length === 0) {
              return null;
            }

            const [featured, ...rest] = group.items;

            return (
              <View
                key={group.section.kind}
                style={groupIndex > 0 ? { marginTop: theme.spacing.xl * scaleSpace } : undefined}
              >
                <View
                  style={[
                    styles.sectionHeader,
                    {
                      marginBottom: theme.spacing.sm * scaleSpace,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.heading, fontSize: 18 * scaleFont },
                    ]}
                  >
                    {resolveFeedSectionTitle(group.section, t)}
                  </Text>
                </View>

                {featured ? (
                  <FeedHeroCard
                    item={featured}
                    kicker={cardKicker(featured, t)}
                    meta={cardMeta(featured, t)}
                  />
                ) : null}

                {rest.length > 0 ? (
                  <View
                    testID="feed-section-rows"
                    style={{ marginTop: theme.spacing.md * scaleSpace }}
                  >
                    {rest.map((item, index) => (
                      <FeedRow
                        key={item.id}
                        item={item}
                        kicker={cardKicker(item, t)}
                        meta={cardMeta(item, t)}
                        divider={index > 0}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
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
