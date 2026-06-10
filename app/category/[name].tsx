import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { toContentCardModel } from "../../src/features/content/selectors";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { HapticsService } from "../../src/features/haptics/haptics";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import { fontFamilies } from "../../src/features/theme/fonts";
import { FeedRow } from "../../src/components/content/feed-row";
import { Screen } from "../../src/components/layout/screen";
import { useGoBack } from "../../src/features/navigation/app-navigation";

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const goBack = useGoBack("/explore");
  const { t } = useTranslation("explore");
  const { theme, tenantSlug } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const contents = useQuery(api.content.queries.listPublishedByCategory, {
    tenantSlug,
    category: name ?? "",
  });

  const items = (contents ?? []).map(toContentCardModel);

  const maxWidth = isTablet ? 640 : undefined;
  const contentStyle = maxWidth
    ? { maxWidth, alignSelf: "center" as const, width: "100%" as const }
    : undefined;

  return (
    <Screen>
      <View
        style={[
          styles.topBar,
          {
            marginHorizontal: -(theme.spacing.lg * scaleSpace),
            paddingHorizontal: theme.spacing.lg * scaleSpace,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            void HapticsService.selection();
            goBack();
          }}
          style={styles.topBarAction}
          accessibilityRole="button"
          accessibilityLabel={t("category.backToExplore")}
        >
          <Text
            style={[
              styles.topBarActionGlyph,
              { color: theme.colors.heading, fontSize: 24 * scaleFont },
            ]}
          >
            ‹
          </Text>
        </Pressable>
        <Text
          style={[
            styles.topBarTitle,
            { color: theme.colors.heading, fontSize: 18 * scaleFont },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      {contents === undefined ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
            {t("category.loading")}
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
            {t("category.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 32, ...(contentStyle ?? {}) },
          ]}
          renderItem={({ item, index }) => (
            <FeedRow
              item={item}
              kicker={item.category}
              meta={item.metaLabel}
              divider={index !== 0}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarAction: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActionGlyph: {
    fontFamily: fontFamilies.body,
    lineHeight: 28,
  },
  topBarSide: {
    width: 34,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: fontFamilies.body,
  },
});
