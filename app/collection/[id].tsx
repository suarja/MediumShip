import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../../src/components/layout/screen";
import { HapticsService } from "../../src/features/haptics/haptics";
import { useCollection } from "../../src/features/collections/use-collections";
import type { CollectionItem } from "../../src/features/collections/types";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const KIND_GLYPH: Record<string, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const insets = useSafeAreaInsets();
  const { collection } = useCollection(id ?? "");
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();

  if (!collection) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.hint, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
            Collection introuvable.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={[
          styles.topBar,
          { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
        ]}
      >
        <Pressable
          onPress={() => {
            void HapticsService.selection();
            router.back();
          }}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.backLabel, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
            ‹
          </Text>
        </Pressable>
        <Text
          style={[styles.topBarTitle, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}
          numberOfLines={1}
        >
          {collection.title}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <FlatList
        data={collection.items}
        keyExtractor={(item) => item.contentId}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + 32,
            ...(isTablet ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {}),
          },
        ]}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.heroCover,
                { backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.18 : 0.08) },
              ]}
            >
              <Text style={[styles.heroCoverGlyph, { color: theme.colors.accent, fontSize: 32 * scaleFont }]}>
                ◆
              </Text>
            </View>
            <View style={[styles.heroBody, { gap: 6 * scaleSpace, marginBottom: 16 * scaleSpace }]}>
              <Text style={[styles.heroBadge, { color: theme.colors.accent, fontSize: 10 * scaleFont }]}>
                ◆ COLLECTION
              </Text>
              <Text style={[styles.heroTitle, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
                {collection.title}
              </Text>
              <Text style={[styles.heroSummary, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
                {collection.summary}
              </Text>
              <Text style={[styles.heroCount, { color: theme.colors.textMuted, fontSize: 10 * scaleFont }]}>
                {`${collection.itemCount} CONTENUS`}
              </Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <CollectionItemRow
            item={item}
            divider={index !== 0}
            onPress={() => {
              if (item.isPremium && !isMember) {
                void HapticsService.medium();
                openPaywall("content");
              } else {
                void HapticsService.light();
                router.push(`/${item.kind}/${item.contentId}` as never);
              }
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function CollectionItemRow({
  item,
  divider,
  onPress,
}: {
  item: CollectionItem;
  divider: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const glyph = KIND_GLYPH[item.kind] ?? "◉";
  const accentColor = item.isPremium ? theme.colors.premium : theme.colors.accent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemRow,
        {
          gap: theme.spacing.md * scaleSpace,
          paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.itemTile,
          {
            width: 52,
            height: 52,
            borderRadius: theme.radii.sm,
            backgroundColor: withAlpha(accentColor, 0.12),
          },
        ]}
      >
        <Text style={[styles.itemGlyph, { color: accentColor, fontSize: 18 * scaleFont }]}>
          {glyph}
        </Text>
      </View>
      <View style={styles.itemCopy}>
        <Text
          style={[styles.itemKicker, { color: accentColor, fontSize: 10 * scaleFont }]}
        >
          {item.category.toUpperCase()}{item.isPremium ? " · ★" : ""}
        </Text>
        <Text
          style={[styles.itemTitle, { color: theme.colors.heading, fontSize: 15 * scaleFont }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  heroCover: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderRadius: 12,
  },
  heroCoverGlyph: {
    fontFamily: fontFamilies.mono,
  },
  heroBody: {},
  heroBadge: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
  },
  heroSummary: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  heroCount: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  list: {},
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: fontFamilies.body,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTile: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemGlyph: {
    fontFamily: fontFamilies.mono,
    textAlign: "center",
  },
  itemCopy: {
    flex: 1,
    gap: 3,
  },
  itemKicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  itemTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.84,
  },
});
