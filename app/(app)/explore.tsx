import { useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { FeedRow } from "../../src/components/content/feed-row";
import { SearchBar } from "../../src/components/search/search-bar";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useCategories } from "../../src/features/categories/use-categories";
import { HapticsService } from "../../src/features/haptics/haptics";
import type { ContentKind } from "../../src/features/content/types";
import { toContentCardModel } from "../../src/features/content/selectors";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useSearch } from "../../src/features/search/use-search";
import { getCategoryIconGlyph } from "../../src/features/categories/category-icon-catalog";
import type { FeatureKey } from "../../convex/featureCatalog";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

type SearchFilter = "all" | ContentKind;

const ALL_MODULE_ITEMS: Array<{ key: FeatureKey; href: string }> = [
  { key: "collections", href: "/collections" },
  { key: "agenda", href: "/agenda" },
  { key: "community", href: "/community" },
];

const TREND_KEYS = [
  "programme2027",
  "localDemocracy",
  "careEconomy",
  "purchasingPower",
  "leaBardin",
] as const;

export default function ExploreScreen() {
  const { t } = useTranslation("explore");
  const { theme, featureConfigs, tenantSlug } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace, contentMaxWidth } = useResponsive();

  const moduleItems = ALL_MODULE_ITEMS.filter(
    (item) => featureConfigs[item.key]?.enabled,
  ).map((item) => ({
    ...item,
    icon: getCategoryIconGlyph(featureConfigs[item.key]?.iconKey ?? "default"),
  }));
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const { results: rawResults, isSearching } = useSearch(searchQuery);
  const { categories } = useCategories();
  const trending = useQuery(api.content.queries.getTrendingTopics, {
    tenantSlug,
  });

  const trendItems =
    trending && trending.topics.length > 0
      ? trending.topics.map((topic) => ({
          id: topic.tag,
          label: topic.tag.replace(/-/g, " "),
        }))
      : TREND_KEYS.map((key) => ({ id: key, label: t(`trends.${key}`) }));

  const isSearchActive = searchQuery.trim().length > 0;

  const filteredResults =
    searchFilter === "all"
      ? rawResults
      : rawResults.filter((c) => c.kind === searchFilter);

  const searchCards = filteredResults.map(toContentCardModel);

  const maxWidth = contentMaxWidth ?? (isTablet ? 640 : undefined);

  const FILTER_OPTIONS: { key: SearchFilter; label: string }[] = [
    { key: "all", label: t("searchResultsAll") },
    { key: "article", label: t("searchResultsArticles") },
    { key: "episode", label: t("searchResultsPodcasts") },
    { key: "video", label: t("searchResultsVideos") },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.lg * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.topBar,
            { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
          ]}
        >
          <View style={styles.topBarSide} />
          <Text
            style={[
              styles.topBarTitle,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
              },
            ]}
          >
            {t("title")}
          </Text>
          <View style={styles.topBarSide} />
        </View>

        <SearchBar
          testID="explore-search"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {isSearchActive ? (
          <View style={{ gap: theme.spacing.sm * scaleSpace }}>
            <View style={[styles.filterRow, { gap: theme.spacing.xs * scaleSpace }]}>
              {FILTER_OPTIONS.map((opt) => {
                const active = searchFilter === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSearchFilter(opt.key)}
                    style={[
                      styles.filterChip,
                      {
                        borderRadius: theme.radii.pill,
                        borderColor: active ? theme.colors.accent : theme.colors.border,
                        backgroundColor: active
                          ? withAlpha(theme.colors.accent, 0.1)
                          : "transparent",
                        paddingHorizontal: 12 * scaleSpace,
                        paddingVertical: 6 * scaleSpace,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.filterLabel,
                        {
                          color: active ? theme.colors.accent : theme.colors.textMuted,
                          fontSize: 12 * scaleFont,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isSearching ? (
              <View style={styles.searchStateWrap}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : searchCards.length === 0 ? (
              <View style={styles.searchStateWrap}>
                <Text
                  style={[
                    styles.emptyLabel,
                    { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
                  ]}
                >
                  {t("searchEmpty")}
                </Text>
              </View>
            ) : (
              searchCards.map((item, index) => (
                <FeedRow
                  key={item.id}
                  item={item}
                  kicker={item.category}
                  meta={item.metaLabel}
                  divider={index !== 0}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <ExploreSection>
              <SectionHeader label={t("categoriesTitle")} />
              <View style={styles.grid}>
                {categories.length > 0
                  ? categories.slice(0, 4).map((cat) => (
                      <Pressable
                        key={cat.category}
                        style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}
                        onPress={() =>
                          router.push(`/category/${encodeURIComponent(cat.category)}` as never)
                        }
                        accessibilityRole="button"
                      >
                        <FeatureCard
                          icon={cat.icon}
                          meta={t("categoryCount_other", { count: cat.count }).toUpperCase()}
                          title={cat.category}
                        />
                      </Pressable>
                    ))
                  : STATIC_CATEGORY_ITEMS.map((item) => (
                      <Pressable
                        key={item.key}
                        style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}
                        onPress={() =>
                          router.push(
                            `/category/${encodeURIComponent(t(`categories.${item.key}.title`))}` as never,
                          )
                        }
                        accessibilityRole="button"
                      >
                        <FeatureCard
                          icon={item.icon}
                          meta={t(`categories.${item.key}.meta`)}
                          title={t(`categories.${item.key}.title`)}
                        />
                      </Pressable>
                    ))}
              </View>
            </ExploreSection>

            {moduleItems.length > 0 ? (
              <ExploreSection>
                <SectionHeader label={t("modulesTitle")} />
                <View style={styles.grid}>
                  {moduleItems.map((item) => (
                    <Link key={item.key} href={item.href as never} asChild>
                      <Pressable
                        style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}
                        accessibilityRole="link"
                      >
                        <FeatureCard
                          icon={item.icon}
                          meta={t(`modules.${item.key}.meta`)}
                          title={t(`modules.${item.key}.title`)}
                        />
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </ExploreSection>
            ) : null}

            <ExploreSection>
              <SectionHeader label={t("trendsTitle")} italic />
              <View style={[styles.trendRow, { gap: theme.spacing.sm * scaleSpace }]}>
                {trendItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void HapticsService.selection();
                      setSearchFilter("all");
                      setSearchQuery(item.label);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t("trendA11y", { label: item.label })}
                    style={[
                      styles.trendChip,
                      {
                        borderRadius: theme.radii.pill,
                        borderColor: withAlpha(
                          theme.colors.heading,
                          theme.isDark ? 0.24 : 0.12,
                        ),
                        backgroundColor: "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trendLabel,
                        {
                          color: theme.colors.heading,
                          fontSize: 12 * scaleFont,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ExploreSection>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const STATIC_CATEGORY_ITEMS = [
  { key: "analyses", icon: "✎" },
  { key: "podcasts", icon: "▷" },
  { key: "videos", icon: "▶" },
] as const;

function ExploreSection({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();

  return (
    <View style={{ gap: (theme.spacing.sm / 2) * scaleSpace }}>
      {children}
    </View>
  );
}

function SectionHeader({
  label,
  italic = false,
}: {
  label: string;
  italic?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.heading,
            fontSize: 17 * scaleFont,
          },
        ]}
      >
        {italic ? (
          <>
            <Text>{label.split(" ")[0]} </Text>
            <Text style={styles.sectionTitleItalic}>
              {label.slice(label.indexOf(" ") + 1)}
            </Text>
          </>
        ) : (
          label
        )}
      </Text>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  meta,
}: {
  icon: string;
  title: string;
  meta: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            borderRadius: theme.radii.pill,
            backgroundColor: withAlpha(
              theme.colors.accent,
              theme.isDark ? 0.22 : 0.12,
            ),
          },
        ]}
      >
        <Text
          style={[
            styles.iconBadgeLabel,
            {
              color: theme.colors.accent,
              fontSize: 16 * scaleFont,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={[styles.cardCopy, { gap: 2 * scaleSpace }]}>
        <Text
          numberOfLines={1}
          style={[
            styles.cardTitle,
            {
              color: theme.colors.heading,
              fontSize: 13 * scaleFont,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.cardMeta,
            {
              color: theme.colors.textMuted,
              fontSize: 9 * scaleFont,
              lineHeight: 12 * scaleFont,
            },
          ]}
        >
          {meta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarSide: {
    width: 34,
    height: 34,
  },
  topBarTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
  },
  searchStateWrap: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLabel: {
    fontFamily: fontFamilies.body,
  },
  sectionHeader: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
  sectionTitleItalic: {
    fontFamily: fontFamilies.displayItalic,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  gridCell: {
    width: "48.5%",
  },
  card: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 2,
  },
  iconBadge: {
    alignSelf: "flex-start",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconBadgeLabel: {
    fontFamily: fontFamilies.mono,
    textAlign: "center",
  },
  cardCopy: {},
  cardTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.15,
  },
  cardMeta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  trendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  trendChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.84,
  },
});
