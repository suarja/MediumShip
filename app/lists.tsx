import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../src/components/layout/screen";
import { LibraryPersonalListRow } from "../src/components/library/library-personal-list-row";
import { usePersonalLists } from "../src/features/personal-lists/use-personal-lists";
import { usePaywallSheet } from "../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../src/features/responsive/use-responsive";
import { withAlpha } from "../src/features/theme/contrast";
import { fontFamilies } from "../src/features/theme/fonts";
import { useAppTheme } from "../src/features/theme/theme-provider";

export default function ListsScreen() {
  const { t } = useTranslation(["lists", "library"]);
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openPaywall } = usePaywallSheet();
  const {
    lists,
    isMember,
    isListsLoading,
    canCreateAnother,
    createList,
  } = usePersonalLists();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePress = () => {
    if (!canCreateAnother) {
      openPaywall("lists");
      return;
    }
    setDraftTitle(t("lists:screen.defaultTitle"));
    setShowCreateForm(true);
  };

  const handleSubmitCreate = async () => {
    const title = draftTitle.trim();
    if (!title || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await createList({ title });
      setShowCreateForm(false);
      setDraftTitle("");
      router.push(`/list/${result.listId}`);
    } catch (error) {
      if (
        error instanceof Error &&
        /Premium required for additional lists/.test(error.message)
      ) {
        openPaywall("lists");
        return;
      }
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

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
          style={styles.topBarAction}
          accessibilityRole="button"
          accessibilityLabel={t("lists:screen.back")}
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
          {t("lists:screen.title")}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xxl * scaleSpace,
            ...(isTablet
              ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const }
              : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stack, { gap: theme.spacing.sm * scaleSpace }]}>
          <Pressable
            accessibilityRole="button"
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.createRow,
              {
                gap: 11 * scaleSpace,
                borderRadius: theme.radii.md,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 11 * scaleSpace,
                paddingVertical: 9 * scaleSpace,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.createIcon,
                {
                  borderRadius: theme.radii.sm,
                  backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12),
                },
              ]}
            >
              <Text
                style={[
                  styles.createIconLabel,
                  { color: theme.colors.accent, fontSize: 18 * scaleFont },
                ]}
              >
                +
              </Text>
            </View>
            <Text
              style={[
                styles.createTitle,
                { color: theme.colors.heading, fontSize: 14 * scaleFont },
              ]}
            >
              {t("lists:screen.createTitle")}
            </Text>
          </Pressable>

          {showCreateForm ? (
            <View
              style={[
                styles.createForm,
                {
                  gap: theme.spacing.sm * scaleSpace,
                  borderRadius: theme.radii.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md * scaleSpace,
                },
              ]}
            >
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                placeholder={t("lists:screen.createPlaceholder")}
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.createInput,
                  {
                    color: theme.colors.heading,
                    borderColor: theme.colors.border,
                    fontSize: 14 * scaleFont,
                  },
                ]}
                autoFocus
                onSubmitEditing={handleSubmitCreate}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isCreating || !draftTitle.trim()}
                onPress={handleSubmitCreate}
                style={({ pressed }) => [
                  styles.createSubmit,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.heading,
                    opacity: isCreating || !draftTitle.trim() ? 0.5 : 1,
                  },
                  pressed && styles.pressed,
                ]}
              >
                {isCreating ? (
                  <ActivityIndicator color={theme.colors.canvas} />
                ) : (
                  <Text
                    style={[
                      styles.createSubmitLabel,
                      {
                        color: theme.colors.canvas,
                        fontSize: 12 * scaleFont,
                      },
                    ]}
                  >
                    {t("lists:screen.createSubmit")}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {isListsLoading ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : lists.length === 0 ? (
            <View style={{ gap: theme.spacing.xs * scaleSpace }}>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.colors.heading, fontSize: 14 * scaleFont },
                ]}
              >
                {t("lists:screen.emptyTitle")}
              </Text>
              <Text
                style={[
                  styles.emptyBody,
                  { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
                ]}
              >
                {t("lists:screen.emptyBody")}
              </Text>
            </View>
          ) : (
            lists.map((list) => (
              <LibraryPersonalListRow
                key={list._id}
                title={list.title}
                meta={t("lists:screen.itemCount", { count: list.itemCount })}
                accessibilityLabel={list.title}
                onPress={() => router.push(`/list/${list._id}`)}
              />
            ))
          )}

          {!isMember ? (
            <View
              style={[
                styles.lockedCard,
                {
                  gap: theme.spacing.sm * scaleSpace,
                  borderRadius: theme.radii.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md * scaleSpace,
                },
              ]}
            >
              <Text
                style={[
                  styles.lockedTitle,
                  { color: theme.colors.heading, fontSize: 14 * scaleFont },
                ]}
              >
                {t("lists:screen.lockedTitle")}
              </Text>
              <Text
                style={[
                  styles.lockedBody,
                  { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
                ]}
              >
                {t("lists:screen.lockedBody")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => openPaywall("lists")}
                style={({ pressed }) => [
                  styles.premiumButton,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.premium,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.premiumButtonLabel,
                    {
                      color: theme.colors.accentContrast,
                      fontSize: 12 * scaleFont,
                    },
                  ]}
                >
                  {t("lists:screen.viewPremiumCta")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
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
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  content: {
    paddingTop: 4,
  },
  stack: {},
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  createForm: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  createInput: {
    fontFamily: fontFamilies.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createSubmit: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: "center",
  },
  createSubmitLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  createIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  createIconLabel: {
    fontFamily: fontFamilies.display,
    lineHeight: 22,
  },
  createTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  emptyTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  emptyBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
  lockedCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  lockedTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  lockedBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
  premiumButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  premiumButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.88,
  },
});
