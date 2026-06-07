import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  ContentCardFavoriteAction,
  ContentCardLikeAction,
  ContentCardOverflowAction,
} from "../../src/components/content/content-card-actions";
import { ContentCard } from "../../src/components/content/content-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import {
  cardDurationMeta,
  discoveryCardKicker,
} from "../../src/features/content/card-presentation";
import { toContentCardModel } from "../../src/features/content/selectors";
import {
  useDiscoveryFeed,
  discoveryFeedItemKey,
  type DiscoveryFeedItem,
} from "../../src/features/discovery/use-discovery-feed";
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
  const {
    items,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSeekingFresh,
    isSignedIn,
    recordLike,
    refresh,
    loadMore,
  } = useDiscoveryFeed();

  if (!isModuleEnabled(enabledModules, "discover")) {
    return null;
  }

  const maxWidth = contentMaxWidth ?? (isTablet ? 640 : undefined);
  const listContentStyle = [
    styles.content,
    {
      paddingBottom: tabBarSpace + persistentPlayerSpace,
      ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" as const } : {}),
    },
  ];

  const renderItem = ({ item }: ListRenderItemInfo<DiscoveryFeedItem>) => {
    const card = toContentCardModel(item);

    return (
      <View
        style={{
          marginBottom: theme.spacing.sm * scaleSpace,
        }}
      >
        <ContentCard
          variant="feature"
          item={card}
          kicker={discoveryCardKicker(card, item.reason, tHome, t)}
          meta={cardDurationMeta(card, tHome)}
          divider={false}
          actions={
            isSignedIn ? (
              <>
                <ContentCardLikeAction
                  isLiked={item.isLiked}
                  onPress={() => recordLike(item._id as never)}
                  accessibilityLabel={t("actions.like")}
                />
                <ContentCardFavoriteAction
                  contentId={item._id as never}
                  accessibilityLabel={t("library:bookmark.saveCta")}
                  savedAccessibilityLabel={t("library:bookmark.savedCta")}
                />
                <ContentCardOverflowAction
                  contentId={item._id as never}
                  accessibilityLabel={t("actions.more")}
                />
              </>
            ) : undefined
          }
        />
      </View>
    );
  };

  return (
    <Screen>
      <FlatList
        testID="discover-list"
        data={items}
        keyExtractor={(item) => discoveryFeedItemKey(item)}
        renderItem={renderItem}
        contentContainerStyle={listContentStyle}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListHeaderComponent={
          <View
            testID="discover-screen"
            style={[
              styles.header,
              {
                gap: theme.spacing.xs * scaleSpace,
                marginBottom: theme.spacing.lg * scaleSpace,
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
        }
        ListEmptyComponent={
          isLoading ? <DiscoverSkeleton /> : items.length === 0 ? <DiscoverEmpty /> : null
        }
        ListFooterComponent={
          items.length > 0 ? (
            <DiscoverFeedFooter
              isLoadingMore={isLoadingMore}
              isSeekingFresh={isSeekingFresh}
            />
          ) : null
        }
      />
    </Screen>
  );
}

function DiscoverFeedFooter({
  isLoadingMore,
  isSeekingFresh,
}: {
  isLoadingMore: boolean;
  isSeekingFresh: boolean;
}) {
  const { t } = useTranslation("discover");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  if (isLoadingMore) {
    return (
      <View
        testID="discover-loading-more"
        style={[
          styles.footer,
          {
            paddingVertical: theme.spacing.md * scaleSpace,
          },
        ]}
      >
        <Text
          style={[
            styles.footerBody,
            { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
          ]}
        >
          {t("loadingMore")}
        </Text>
      </View>
    );
  }

  if (!isSeekingFresh) {
    return null;
  }

  return (
    <View
      testID="discover-more-incoming"
      style={[
        styles.footer,
        {
          paddingVertical: theme.spacing.md * scaleSpace,
          gap: theme.spacing.xs * scaleSpace,
        },
      ]}
    >
      <Text
        style={[
          styles.footerBody,
          {
            color: theme.colors.textMuted,
            fontSize: 13 * scaleFont,
            textAlign: "center",
          },
        ]}
      >
        {t("moreIncoming")}
      </Text>
      <Text
        style={[
          styles.footerHint,
          {
            color: withAlpha(theme.colors.textMuted, 0.72),
            fontSize: 12 * scaleFont,
            textAlign: "center",
          },
        ]}
      >
        {t("seekingFreshNote")}
      </Text>
    </View>
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
        { gap: theme.spacing.md * scaleSpace },
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
  header: {},
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
    paddingHorizontal: 0,
  },
  footer: {
    alignItems: "center",
  },
  footerBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  footerHint: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
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
