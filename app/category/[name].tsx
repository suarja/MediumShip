import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { toContentCardModel } from "../../src/features/content/selectors";
import type { ContentKind } from "../../src/features/content/types";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import { fontFamilies } from "../../src/features/theme/fonts";
import { withAlpha } from "../../src/features/theme/contrast";
import { FeedRow } from "../../src/components/content/feed-row";
import { Screen } from "../../src/components/layout/screen";

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { theme, tenantSlug } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const contents = useQuery(api.content.queries.listPublishedFeed, { tenantSlug });

  const filtered = (contents ?? [])
    .filter((c) => c.category.toLowerCase() === (name ?? "").toLowerCase())
    .map(toContentCardModel);

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
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.backLabel, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
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
            Chargement…
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
            Aucun contenu dans cette catégorie.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
  backBtn: {
    width: 34,
    alignItems: "flex-start",
  },
  backLabel: {
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
