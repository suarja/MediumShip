import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { FeedRow } from "../../src/components/content/feed-row";
import { Screen } from "../../src/components/layout/screen";
import { toContentCardModel } from "../../src/features/content/selectors";
import { usePersonalLists } from "../../src/features/personal-lists/use-personal-lists";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import { useGoBack } from "../../src/features/navigation/app-navigation";

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = id as Id<"personalLists">;
  const goBack = useGoBack("/lists");
  const { t } = useTranslation("lists");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const { renameList, removeList } = usePersonalLists();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const data = useQuery(api.personalLists.queries.listWithItems, { listId });

  const handleDelete = () => {
    Alert.alert(
      t("detail.deleteConfirmTitle"),
      t("detail.deleteConfirmBody"),
      [
        { text: t("detail.cancel"), style: "cancel" },
        {
          text: t("detail.deleteConfirmCta"),
          style: "destructive",
          onPress: async () => {
            await removeList({ listId });
            goBack();
          },
        },
      ],
    );
  };

  const handleRenameSubmit = async () => {
    const title = draftTitle.trim();
    if (!title) {
      return;
    }
    await renameList({ listId, title });
    setIsRenaming(false);
  };

  if (data === undefined) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }

  const items = data.items.map((entry) => ({
    ...entry,
    card: toContentCardModel(entry.content),
  }));

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
          onPress={goBack}
          style={styles.topBarAction}
          accessibilityRole="button"
          accessibilityLabel={t("detail.back")}
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
          {data.list.title}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <View
        style={[
          styles.actions,
          {
            gap: theme.spacing.sm * scaleSpace,
            marginBottom: theme.spacing.md * scaleSpace,
            ...(isTablet
              ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const }
              : {}),
          },
        ]}
      >
        {isRenaming ? (
          <View style={{ flex: 1, gap: theme.spacing.xs * scaleSpace }}>
            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder={t("detail.renamePlaceholder")}
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.renameInput,
                {
                  color: theme.colors.heading,
                  borderColor: theme.colors.border,
                  fontSize: 14 * scaleFont,
                },
              ]}
              autoFocus
              onSubmitEditing={handleRenameSubmit}
            />
            <Pressable
              accessibilityRole="button"
              onPress={handleRenameSubmit}
              style={({ pressed }) => [
                styles.actionChip,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.actionChipLabel,
                  { color: theme.colors.canvas, fontSize: 11 * scaleFont },
                ]}
              >
                {t("detail.renameSubmit")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraftTitle(data.list.title);
                setIsRenaming(true);
              }}
              style={({ pressed }) => [
                styles.actionChip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.actionChipLabel,
                  { color: theme.colors.heading, fontSize: 11 * scaleFont },
                ]}
              >
                {t("detail.rename")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.actionChip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.actionChipLabel,
                  { color: theme.colors.heading, fontSize: 11 * scaleFont },
                ]}
              >
                {t("detail.delete")}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {items.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              paddingBottom: insets.bottom + theme.spacing.xxl * scaleSpace,
              ...(isTablet
                ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const }
                : {}),
            },
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.heading, fontSize: 16 * scaleFont },
            ]}
          >
            {t("detail.emptyTitle")}
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
            ]}
          >
            {t("detail.emptyBody")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.itemId}
          contentContainerStyle={{
            paddingBottom: insets.bottom + theme.spacing.xxl * scaleSpace,
            ...(isTablet
              ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const }
              : {}),
          }}
          renderItem={({ item, index }) => (
            <FeedRow
              item={item.card}
              kicker={item.card.kindLabel}
              meta={item.card.category}
              divider={index > 0}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionChipLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  renameInput: {
    fontFamily: fontFamilies.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  empty: {
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 20,
  },
  emptyBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
});
