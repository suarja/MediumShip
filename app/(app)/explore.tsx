import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const CATEGORY_ITEMS = [
  { key: "analyses", icon: "✎" },
  { key: "podcasts", icon: "▷" },
  { key: "videos", icon: "▶" },
  { key: "agenda", icon: "☷" },
] as const;

const MODULE_ITEMS = [
  { key: "collections", icon: "◆" },
  { key: "community", icon: "✦" },
] as const;

const TREND_KEYS = [
  "programme2027",
  "localDemocracy",
  "careEconomy",
  "purchasingPower",
  "leaBardin",
] as const;

export default function ExploreScreen() {
  const { t } = useTranslation("explore");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

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

        <Pressable
          accessibilityRole="button"
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
              },
            ]}
          >
            ⌕
          </Text>
          <Text
            style={[
              styles.searchLabel,
              {
                color: theme.colors.textMuted,
                fontSize: 15 * scaleFont,
              },
            ]}
          >
            {t("searchPlaceholder")}
          </Text>
        </Pressable>

        <SectionHeader label={t("categoriesTitle")} />
        <View style={styles.grid}>
          {CATEGORY_ITEMS.map((item) => (
            <FeatureCard
              key={item.key}
              icon={item.icon}
              meta={t(`categories.${item.key}.meta`)}
              title={t(`categories.${item.key}.title`)}
            />
          ))}
        </View>

        <SectionHeader label={t("modulesTitle")} />
        <View style={styles.grid}>
          {MODULE_ITEMS.map((item) => (
            <FeatureCard
              key={item.key}
              icon={item.icon}
              meta={t(`modules.${item.key}.meta`)}
              title={t(`modules.${item.key}.title`)}
            />
          ))}
        </View>

        <View style={[styles.section, { gap: theme.spacing.sm * scaleSpace }]}>
          <SectionHeader label={t("trendsTitle")} italic />
          <View style={[styles.trendRow, { gap: theme.spacing.sm * scaleSpace }]}>
            {TREND_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.trendChip,
                  {
                    borderRadius: theme.radii.pill,
                    borderColor: withAlpha(theme.colors.heading, theme.isDark ? 0.24 : 0.12),
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
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
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
            fontSize: 19 * scaleFont,
          },
        ]}
      >
        {italic ? (
          <>
            <Text>{label.split(" ")[0]} </Text>
            <Text style={styles.sectionTitleItalic}>{label.slice(label.indexOf(" ") + 1)}</Text>
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
    <Pressable
      accessibilityRole="button"
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
            backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12),
          },
        ]}
      >
        <Text
          style={[
            styles.iconBadgeLabel,
            {
              color: theme.colors.accent,
              fontSize: 15 * scaleFont,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={[styles.cardCopy, { gap: 2 * scaleSpace }]}>
        <Text
          style={[
            styles.cardTitle,
            {
              color: theme.colors.heading,
              fontSize: 15 * scaleFont,
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
              fontSize: 10 * scaleFont,
            },
          ]}
        >
          {meta}
        </Text>
      </View>
    </Pressable>
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
    width: 18,
    textAlign: "center",
    lineHeight: 22,
  },
  searchLabel: {
    flex: 1,
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
  card: {
    width: "48.5%",
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
    letterSpacing: -0.25,
  },
  cardMeta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    lineHeight: 14,
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
});
