import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { HapticsService } from "../../features/haptics/haptics";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import type { ContentActionsFocus } from "../../features/content/content-actions-sheet-provider";
import type { ContentDoc } from "../../features/content/types";
import { getDownloadSupport } from "../../features/downloads/model";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useIsMember } from "../../features/membership/use-is-member";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { usePersonalLists } from "../../features/personal-lists/use-personal-lists";
import { hasCapability } from "../../features/tenant/public-config";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  visible: boolean;
  contentId: Id<"contents"> | null;
  focus: ContentActionsFocus;
  onDismiss: () => void;
};

export function ContentActionsSheet({
  visible,
  contentId,
  focus,
  onDismiss,
}: Props) {
  const { t } = useTranslation(["lists", "library"]);
  const { theme, enabledModules } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useClerkAuth();
  const { isMember } = useIsMember();
  const { openPaywall } = usePaywallSheet();
  const canBookmark = hasCapability(enabledModules, "bookmarks");
  const canPersonalLists = hasCapability(enabledModules, "personalLists");
  const canOffline = hasCapability(enabledModules, "offline");
  const maxWidth = isTablet ? 520 : undefined;

  const content = useQuery(
    api.content.queries.getPublishedById,
    visible && contentId ? { id: contentId } : "skip",
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  if (!visible || !contentId) {
    return null;
  }

  const dismissWithSelection = () => {
    void HapticsService.selection();
    onDismiss();
  };

  const keyboardSheetGap = 14 * scaleSpace;
  const sheetLift =
    keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom + keyboardSheetGap)
      : 0;
  const sheetPaddingBottom =
    keyboardHeight > 0 ? 16 * scaleSpace : insets.bottom + 24 * scaleSpace;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissWithSelection}
    >
        <View style={[styles.backdrop, { backgroundColor: withAlpha(theme.colors.canvas, 0.72) }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissWithSelection}
            accessibilityLabel={t("lists:actionsSheet.dismiss")}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.canvas,
                borderTopLeftRadius: theme.radii.xl,
                borderTopRightRadius: theme.radii.xl,
                borderColor: theme.colors.border,
                marginBottom: sheetLift,
                paddingBottom: sheetPaddingBottom,
                alignSelf: "center",
                width: maxWidth ?? "100%",
                maxHeight: "78%",
              },
            ]}
          >
            <View style={styles.grab}>
              <View
                style={[styles.grabBar, { backgroundColor: withAlpha(theme.colors.heading, 0.2) }]}
              />
            </View>

            <ScrollView
              contentContainerStyle={[styles.body, { gap: 12 * scaleSpace }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text
              numberOfLines={2}
              style={[
                styles.title,
                { color: theme.colors.heading, fontSize: 18 * scaleFont },
              ]}
            >
              {content?.title ?? t("lists:actionsSheet.title")}
            </Text>

            {content === undefined ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : content === null ? (
              <Text style={{ color: theme.colors.textMuted }}>
                {t("lists:actionsSheet.unavailable")}
              </Text>
            ) : (
              <SheetBody
                content={content}
                focus={focus}
                canBookmark={canBookmark}
                canPersonalLists={canPersonalLists}
                canOffline={canOffline}
                isSignedIn={isSignedIn}
                isMember={isMember}
                onDismiss={onDismiss}
                onDismissWithSelection={dismissWithSelection}
                onSignIn={() => {
                  void HapticsService.light();
                  onDismiss();
                  router.push("/sign-in");
                }}
                onOpenPaywall={openPaywall}
              />
            )}
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
}

function SheetBody({
  content,
  focus,
  canBookmark,
  canPersonalLists,
  canOffline,
  isSignedIn,
  isMember,
  onDismiss,
  onDismissWithSelection,
  onSignIn,
  onOpenPaywall,
}: {
  content: ContentDoc;
  focus: ContentActionsFocus;
  canBookmark: boolean;
  canPersonalLists: boolean;
  canOffline: boolean;
  isSignedIn: boolean;
  isMember: boolean;
  onDismiss: () => void;
  onDismissWithSelection: () => void;
  onSignIn: () => void;
  onOpenPaywall: (reason: "offline" | "lists") => void;
}) {
  const { t } = useTranslation(["lists", "library", "discover"]);
  const { theme, tenantSlug } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const recordInteraction = useMutation(api.discovery.interactions.recordInteraction);
  const {
    bookmarks,
    toggleBookmark,
    isBookmarksLoading,
  } = useBookmarks();
  const {
    downloadedItem,
    isDownloading,
    isLoading: isDownloadsLoading,
    downloadContent,
  } = useDownloads({
    contentId: content._id,
    enabled: isSignedIn && isMember,
  });

  const isSaved = bookmarks.some((bookmark) => bookmark.content._id === content._id);
  const downloadSupport = getDownloadSupport(content);
  const showGeneralActions = focus === "all";
  const showDiscoveryActions = focus === "discovery";

  return (
    <View style={{ gap: 8 * scaleSpace }}>
      {showGeneralActions && canBookmark ? (
        <SheetActionRow
          icon={isSaved ? "bookmark" : "bookmark-outline"}
          label={isSaved ? t("library:bookmark.savedCta") : t("library:bookmark.saveCta")}
          loading={isBookmarksLoading}
          onPress={() => {
            if (!isSignedIn) {
              onSignIn();
              return;
            }
            void toggleBookmark({
              contentId: content._id as Id<"contents">,
              isSaved,
            });
          }}
        />
      ) : null}

      {canPersonalLists ? (
        <AddToListSection
          contentId={content._id as Id<"contents">}
          isSignedIn={isSignedIn}
          onSignIn={onSignIn}
          onOpenPaywall={onOpenPaywall}
        />
      ) : null}

      {(showGeneralActions || showDiscoveryActions) && canOffline ? (
        <SheetActionRow
          icon={
            downloadedItem
              ? "download"
              : downloadSupport.kind === "unsupported"
                ? "cloud-offline-outline"
                : "download-outline"
          }
          label={
            downloadedItem
              ? t("library:download.downloadedCta")
              : isDownloading
                ? t("library:download.downloadingCta")
                : t("library:download.downloadCta")
          }
          loading={isDownloadsLoading}
          tone="premium"
          disabled={
            Boolean(downloadedItem) ||
            isDownloading ||
            downloadSupport.kind === "unsupported"
          }
          onPress={() => {
            if (!isSignedIn || !isMember) {
              void HapticsService.medium();
              onOpenPaywall("offline");
              return;
            }
            void HapticsService.medium();
            void downloadContent(content);
          }}
        />
      ) : null}

      {showDiscoveryActions ? (
        <SheetActionRow
          testID="discover-hide-action"
          icon="eye-off-outline"
          label={t("discover:actions.notInterested")}
          onPress={() => {
            if (!isSignedIn) {
              onSignIn();
              return;
            }
            void HapticsService.warning();
            void recordInteraction({
              tenantSlug,
              contentId: content._id as Id<"contents">,
              type: "hide",
            });
            onDismiss();
          }}
        />
      ) : null}

      {showGeneralActions || showDiscoveryActions ? (
        <Pressable
          accessibilityRole="button"
          onPress={onDismissWithSelection}
          style={({ pressed }) => [
            styles.cancelRow,
            {
              borderRadius: theme.radii.md,
              borderColor: theme.colors.border,
              marginTop: 4 * scaleSpace,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.cancelLabel,
              { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
            ]}
          >
            {t("lists:actionsSheet.dismiss")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AddToListSection({
  contentId,
  isSignedIn,
  onSignIn,
  onOpenPaywall,
}: {
  contentId: Id<"contents">;
  isSignedIn: boolean;
  onSignIn: () => void;
  onOpenPaywall: (reason: "lists") => void;
}) {
  const { t } = useTranslation("lists");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { canCreateAnother, createList, addItem, removeItem } = usePersonalLists();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const lists = useQuery(
    api.personalLists.queries.listMineForContent,
    isSignedIn ? { contentId } : "skip",
  );

  if (!isSignedIn) {
    return (
      <SheetActionRow
        icon="list-outline"
        label={t("actionsSheet.addToList")}
        hint={t("actionsSheet.signInHint")}
        onPress={onSignIn}
      />
    );
  }

  const handleCreate = async () => {
    const title = draftTitle.trim();
    if (!title || isCreating) {
      return;
    }

    if (!canCreateAnother) {
      void HapticsService.medium();
      onOpenPaywall("lists");
      return;
    }

    void HapticsService.success();
    setIsCreating(true);
    try {
      const result = await createList({ title });
      await addItem({ listId: result.listId, contentId });
      setShowCreateForm(false);
      setDraftTitle("");
    } catch (error) {
      void HapticsService.error();
      if (
        error instanceof Error &&
        /Premium required for additional lists/.test(error.message)
      ) {
        void HapticsService.medium();
        onOpenPaywall("lists");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const toggleList = async (listId: Id<"personalLists">, contains: boolean) => {
    if (contains) {
      await removeItem({ listId, contentId });
      return;
    }
    await addItem({ listId, contentId });
  };

  return (
    <View
      style={[
        styles.listSection,
        {
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: 12 * scaleSpace,
          gap: 8 * scaleSpace,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionLabel,
          { color: theme.colors.textMuted, fontSize: 10 * scaleFont },
        ]}
      >
        {t("actionsSheet.addToList")}
      </Text>

      {lists === undefined ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : lists.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 * scaleFont }}>
          {t("actionsSheet.noLists")}
        </Text>
      ) : (
        lists.map((list) => (
          <Pressable
            key={list._id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: list.contains }}
            onPress={() => {
              void (list.contains
                ? HapticsService.selection()
                : HapticsService.success());
              void toggleList(list._id, list.contains);
            }}
            style={({ pressed }) => [
              styles.listRow,
              { gap: 10 * scaleSpace },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={list.contains ? theme.colors.accent : theme.colors.textMuted}
              name={list.contains ? "checkmark-circle" : "ellipse-outline"}
              size={20 * scaleFont}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={[
                  styles.listTitle,
                  { color: theme.colors.heading, fontSize: 14 * scaleFont },
                ]}
              >
                {list.title}
              </Text>
              <Text
                style={[
                  styles.listMeta,
                  { color: theme.colors.textMuted, fontSize: 10 * scaleFont },
                ]}
              >
                {t("screen.itemCount", { count: list.itemCount })}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {showCreateForm ? (
        <View style={{ gap: 8 * scaleSpace }}>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder={t("screen.createPlaceholder")}
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
            onSubmitEditing={() => {
              void HapticsService.light();
              void handleCreate();
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isCreating || !draftTitle.trim()}
            onPress={() => void handleCreate()}
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
                  { color: theme.colors.canvas, fontSize: 12 * scaleFont },
                ]}
              >
                {t("screen.createSubmit")}
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!canCreateAnother) {
              void HapticsService.medium();
              onOpenPaywall("lists");
              return;
            }
            void HapticsService.light();
            setDraftTitle(t("screen.defaultTitle"));
            setShowCreateForm(true);
          }}
          style={({ pressed }) => [
            styles.listRow,
            { gap: 10 * scaleSpace },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons color={theme.colors.accent} name="add-circle-outline" size={20 * scaleFont} />
          <Text
            style={[
              styles.listTitle,
              { color: theme.colors.accent, fontSize: 14 * scaleFont },
            ]}
          >
            {t("actionsSheet.createList")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function SheetActionRow({
  icon,
  label,
  hint,
  onPress,
  loading = false,
  disabled = false,
  tone = "accent",
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "accent" | "premium";
  testID?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const color = tone === "premium" ? theme.colors.premium : theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          gap: 12 * scaleSpace,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 14 * scaleSpace,
          paddingVertical: 12 * scaleSpace,
          opacity: disabled ? 0.55 : 1,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons color={theme.colors.heading} name={icon} size={20 * scaleFont} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            styles.actionLabel,
            { color: theme.colors.heading, fontSize: 14 * scaleFont },
          ]}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              styles.actionHint,
              { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grab: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  actionHint: {
    fontFamily: fontFamilies.body,
    marginTop: 2,
  },
  listSection: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  listTitle: {
    fontFamily: fontFamilies.display,
  },
  listMeta: {
    fontFamily: fontFamilies.body,
    marginTop: 1,
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
  cancelRow: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  cancelLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.86,
  },
});
