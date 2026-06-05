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
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 30 * scaleFont,
              },
            ]}
          >
            {t("title")}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.searchCard,
            {
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.heading,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              {
                color: theme.colors.accent,
                fontSize: 16 * scaleFont,
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

        <SectionTitle label={t("categoriesTitle")} />
        <View style={[styles.grid, { gap: theme.spacing.md * scaleSpace }]}>
          {CATEGORY_ITEMS.map((item) => (
            <FeatureCard
              key={item.key}
              icon={item.icon}
              meta={t(`categories.${item.key}.meta`)}
              title={t(`categories.${item.key}.title`)}
            />
          ))}
        </View>

        <SectionTitle label={t("modulesTitle")} />
        <View style={[styles.grid, { gap: theme.spacing.md * scaleSpace }]}>
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
          <SectionTitle label={t("trendsTitle")} />
          <View style={[styles.trendRow, { gap: theme.spacing.sm * scaleSpace }]}>
            {TREND_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.trendChip,
                  {
                    borderRadius: theme.radii.pill,
                    borderColor: withAlpha(theme.colors.accent, theme.isDark ? 0.34 : 0.18),
                    backgroundColor: withAlpha(
                      theme.colors.accent,
                      theme.isDark ? 0.14 : 0.08,
                    ),
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

function SectionTitle({ label }: { label: string }) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <Text
      style={[
        styles.sectionTitle,
        {
          color: theme.colors.heading,
          fontSize: 20 * scaleFont,
        },
      ]}
    >
      {label}
    </Text>
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
          borderRadius: theme.radii.xl,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.heading,
          gap: theme.spacing.sm * scaleSpace,
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

      <View style={[styles.cardCopy, { gap: 4 * scaleSpace }]}>
        <Text
          style={[
            styles.cardTitle,
            {
              color: theme.colors.heading,
              fontSize: 16 * scaleFont,
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
              fontSize: 13 * scaleFont,
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
  header: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.5,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  searchIcon: {
    fontFamily: fontFamilies.mono,
  },
  searchLabel: {
    flex: 1,
    fontFamily: fontFamilies.body,
  },
  section: {},
  sectionTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
  grid: {},
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  iconBadge: {
    alignSelf: "flex-start",
    minWidth: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBadgeLabel: {
    fontFamily: fontFamilies.mono,
    textAlign: "center",
  },
  cardCopy: {},
  cardTitle: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.25,
  },
  cardMeta: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  trendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  trendChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  trendLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
