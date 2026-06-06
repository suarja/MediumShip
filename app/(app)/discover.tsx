import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ContentCard } from "../../src/components/content/content-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { cardKicker, cardMeta } from "../../src/features/content/card-presentation";
import { toContentCardModel } from "../../src/features/content/selectors";
import { useDiscoveryFeed } from "../../src/features/discovery/use-discovery-feed";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { isModuleEnabled } from "../../src/features/tenant/public-config";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function DiscoverScreen() {
  const { t } = useTranslation("discover");
  const { t: tHome } = useTranslation("home");
  const { theme, enabledModules } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace, contentMaxWidth } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const { items, isLoading } = useDiscoveryFeed();

  if (!isModuleEnabled(enabledModules, "discover")) {
    return null;
  }

  const maxWidth = contentMaxWidth ?? (isTablet ? 640 : undefined);

  return (
    <Screen>
      <View
        testID="discover-screen"
        style={[
          styles.header,
          {
            gap: theme.spacing.xs * scaleSpace,
            marginBottom: theme.spacing.lg * scaleSpace,
            ...(maxWidth ? { maxWidth, alignSelf: "center", width: "100%" } : {}),
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontSize: 28 * scaleFont },
          ]}
        >
          {t("title")}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
          ]}
        >
          {t("subtitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: tabBarSpace + persistentPlayerSpace,
            ...(maxWidth ? { maxWidth, alignSelf: "center", width: "100%" } : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <DiscoverSkeleton />
        ) : items.length === 0 ? (
          <DiscoverEmpty />
        ) : (
          items.map((item, index) => {
            const card = toContentCardModel(item);

            return (
              <ContentCard
                key={item._id}
                item={card}
                reasonLabel={t(`reason.${item.reason}`)}
                kicker={cardKicker(card, tHome)}
                meta={cardMeta(card, tHome)}
                divider={index > 0}
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function DiscoverSkeleton() {
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();

  return (
    <View
      testID="discover-loading"
      style={[
        styles.skeletonStack,
        { gap: theme.spacing.md * scaleSpace, paddingHorizontal: theme.spacing.lg * scaleSpace },
      ]}
    >
      {Array.from({ length: 4 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonRow,
            {
              gap: theme.spacing.md * scaleSpace,
              paddingTop: index > 0 ? theme.spacing.md * scaleSpace : 0,
              borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.skeletonTile,
              {
                borderRadius: theme.radii.sm,
                backgroundColor: withAlpha(theme.colors.heading, 0.08),
              },
            ]}
          />
          <View style={[styles.skeletonCopy, { gap: theme.spacing.xs * scaleSpace }]}>
            <View
              style={[
                styles.skeletonLine,
                {
                  width: "28%",
                  backgroundColor: withAlpha(theme.colors.accent, 0.18),
                },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                {
                  width: "88%",
                  backgroundColor: withAlpha(theme.colors.heading, 0.1),
                },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                {
                  width: "42%",
                  backgroundColor: withAlpha(theme.colors.heading, 0.06),
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function DiscoverEmpty() {
  const { t } = useTranslation("discover");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <View
      testID="discover-empty"
      style={[
        styles.empty,
        {
          marginHorizontal: theme.spacing.lg * scaleSpace,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg * scaleSpace,
          gap: theme.spacing.sm * scaleSpace,
        },
      ]}
    >
      <Text style={[styles.emptyTitle, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}>
        {t("emptyTitle")}
      </Text>
      <Text style={[styles.emptyBody, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
        {t("emptyBody")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  content: {
    flexGrow: 1,
  },
  skeletonStack: {},
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonTile: {
    width: 60,
    height: 60,
  },
  skeletonCopy: {
    flex: 1,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 4,
  },
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  emptyBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
});
