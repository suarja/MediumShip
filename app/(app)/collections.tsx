import { useGoBack, usePushWithReturn } from "../../src/features/navigation/app-navigation";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { HapticsService } from "../../src/features/haptics/haptics";
import { useCollections } from "../../src/features/collections/use-collections";
import type { Collection } from "../../src/features/collections/types";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function CollectionsScreen() {
  const { t } = useTranslation("explore");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const goBack = useGoBack("/explore");
  const pushWithReturn = usePushWithReturn();
  const insets = useSafeAreaInsets();
  const { collections } = useCollections();

  return (
    <FeatureAccessGate featureKey="collections">
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
            goBack();
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
        >
          {t("modules.collections.title")}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.list,
          {
            gap: theme.spacing.md * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace + insets.bottom,
            ...(isTablet ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {}),
          },
        ]}
        ListHeaderComponent={
          <Text
            style={[
              styles.intro,
              { color: theme.colors.textMuted, fontSize: 14 * scaleFont, marginBottom: theme.spacing.sm * scaleSpace },
            ]}
          >
            Des parcours thématiques construits par la rédaction — séries, dossiers et formats au long cours.
          </Text>
        }
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={() => pushWithReturn(`/collection/${item._id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
    </FeatureAccessGate>
  );
}

function CollectionCard({
  collection,
  onPress,
}: {
  collection: Collection;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <Pressable
      onPress={() => {
        void HapticsService.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.collectionCard,
        {
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          overflow: "hidden" as const,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.collectionCoverPlaceholder,
          { backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.18 : 0.08) },
        ]}
      >
        <Text style={[styles.collectionCoverGlyph, { color: theme.colors.accent, fontSize: 22 * scaleFont }]}>
          ◆
        </Text>
      </View>
      <View style={[styles.collectionMeta, { padding: 14 * scaleSpace, gap: 4 * scaleSpace }]}>
        <Text
          style={[styles.collectionByline, { color: theme.colors.accent, fontSize: 12 * scaleFont }]}
        >
          ◆ PAR LA RÉDACTION
        </Text>
        <Text
          style={[styles.collectionTitle, { color: theme.colors.heading, fontSize: 17 * scaleFont }]}
          numberOfLines={2}
        >
          {collection.title}
        </Text>
        <Text
          style={[styles.collectionSummary, { color: theme.colors.textMuted, fontSize: 13 * scaleFont }]}
          numberOfLines={2}
        >
          {collection.summary}
        </Text>
        <Text
          style={[styles.collectionCount, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}
        >
          {`${collection.itemCount} CONTENUS`.toUpperCase()}
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
  list: {
    paddingTop: 8,
  },
  intro: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  collectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  collectionCoverPlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionCoverGlyph: {
    fontFamily: fontFamilies.mono,
  },
  collectionMeta: {},
  collectionByline: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  collectionTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
  collectionSummary: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  collectionCount: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  pressed: {
    opacity: 0.84,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailable: {
    fontFamily: fontFamilies.body,
  },
});
