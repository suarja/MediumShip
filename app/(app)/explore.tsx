import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { FeedRow } from "../../src/components/content/feed-row";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { getCategoryPresentation } from "../../src/features/categories/category-presentation";
import { useCategories } from "../../src/features/categories/use-categories";
import type { ContentKind } from "../../src/features/content/types";
import { toContentCardModel } from "../../src/features/content/selectors";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useSearch } from "../../src/features/search/use-search";
import { isModuleEnabled } from "../../src/features/tenant/public-config";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

type SearchFilter = "all" | ContentKind;

const ALL_MODULE_ITEMS = [
  { key: "collections" as const, icon: "◆", href: "/collections" },
  { key: "agenda" as const, icon: "☷", href: "/agenda" },
  { key: "community" as const, icon: "✦", href: "/community" },
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
  const { theme, enabledModules } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace, contentMaxWidth } = useResponsive();

  const moduleItems = ALL_MODULE_ITEMS.filter((item) =>
    isModuleEnabled(enabledModules, item.key),
  );
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const { results: rawResults, isSearching } = useSearch(searchQuery);
  const { categories } = useCategories();

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

        <View
          style={[
            styles.searchCard,
            {
              borderRadius: theme.radii.pill,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              {
                color: theme.colors.accent,
                fontSize: 19 * scaleFont,
                width: 22 * scaleSpace,
              },
            ]}
          >
            ⌕
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontSize: 15 * scaleFont,
                fontFamily: fontFamilies.body,
              },
            ]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

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
            <SectionHeader label={t("categoriesTitle")} />
            <View style={styles.grid}>
              {categories.length > 0
                ? categories.slice(0, 4).map((cat) => {
                    const presentation = getCategoryPresentation(cat.category);

                    return (
                    <Pressable
                      key={cat.category}
                      style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}
                      onPress={() => router.push(`/category/${encodeURIComponent(cat.category)}` as never)}
                      accessibilityRole="button"
                    >
                      <FeatureCard
                        icon={presentation.icon}
                        meta={t("categoryCount_other", { count: cat.count }).toUpperCase()}
                        title={cat.category}
                      />
                    </Pressable>
                    );
                  })
                : STATIC_CATEGORY_ITEMS.map((item) => (
                    <Pressable
                      key={item.key}
                      style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}
                      onPress={() =>
                        router.push(`/category/${encodeURIComponent(t(`categories.${item.key}.title`))}` as never)
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

            {moduleItems.length > 0 && (
              <>
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
              </>
            )}

            <View style={[styles.section, { gap: theme.spacing.sm * scaleSpace }]}>
              <SectionHeader label={t("trendsTitle")} italic />
              <View style={[styles.trendRow, { gap: theme.spacing.sm * scaleSpace }]}>
                {TREND_KEYS.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setSearchFilter("all");
                      setSearchQuery(t(`trends.${key}`));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t("trendA11y", { label: t(`trends.${key}`) })}
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
                      {t(`trends.${key}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
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
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 42,
    paddingHorizontal: 15,
  },
  searchIcon: {
    width: 22,
    textAlign: "center",
    lineHeight: 22,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
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
  section: {},
  sectionHeader: {
    paddingTop: 4,
    paddingBottom: 12,
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
