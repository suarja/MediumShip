import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import type { Id } from "../../../convex/_generated/dataModel";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import type { ContentActionsFocus } from "../../features/content/content-actions-sheet-provider";
import { useContentActionsSheet } from "../../features/content/content-actions-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { hasCapability } from "../../features/tenant/public-config";
import { useAppTheme } from "../../features/theme/theme-provider";

/** Inline like toggle — icon only. */
export function ContentCardLikeAction({
  isLiked,
  onPress,
  accessibilityLabel,
}: {
  isLiked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <CardIconAction
      testID="discover-like-button"
      icon={isLiked ? "heart" : "heart-outline"}
      active={isLiked}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

/** Inline bookmark (Favoris) toggle — icon only. Persists to `bookmarks`, not `contentInteractions`. */
export function ContentCardFavoriteAction({
  contentId,
  accessibilityLabel,
  savedAccessibilityLabel,
}: {
  contentId: Id<"contents">;
  accessibilityLabel: string;
  savedAccessibilityLabel: string;
}) {
  const router = useRouter();
  const { enabledModules } = useAppTheme();
  const {
    bookmarks,
    toggleBookmark,
    isBookmarksLoading,
    canAccessBookmarks,
  } = useBookmarks();
  const canBookmark = hasCapability(enabledModules, "bookmarks");
  const serverSaved = bookmarks.some(
    (bookmark) => bookmark.content._id === contentId,
  );
  const [pendingSaved, setPendingSaved] = useState<boolean | null>(null);
  const isSaved = pendingSaved ?? serverSaved;

  useEffect(() => {
    setPendingSaved(null);
  }, [serverSaved, contentId]);

  if (!canBookmark) {
    return null;
  }

  return (
    <CardIconAction
      testID="discover-favorite-button"
      icon={isSaved ? "bookmark" : "bookmark-outline"}
      active={isSaved}
      loading={canAccessBookmarks && isBookmarksLoading}
      onPress={() => {
        if (!canAccessBookmarks) {
          router.push("/sign-in");
          return;
        }

        const nextSaved = !isSaved;
        setPendingSaved(nextSaved);
        void toggleBookmark({ contentId, isSaved }).catch(() => {
          setPendingSaved(null);
        });
      }}
      accessibilityLabel={isSaved ? savedAccessibilityLabel : accessibilityLabel}
    />
  );
}

/** Opens the shared content actions sheet — icon only. */
export function ContentCardOverflowAction({
  contentId,
  focus = "discovery",
  accessibilityLabel,
}: {
  contentId: Id<"contents">;
  focus?: ContentActionsFocus;
  accessibilityLabel: string;
}) {
  const { openContentActions } = useContentActionsSheet();

  return (
    <CardIconAction
      testID="discover-overflow-button"
      icon="ellipsis-horizontal"
      onPress={() => openContentActions(contentId, focus)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

function CardIconAction({
  icon,
  active = false,
  loading = false,
  onPress,
  accessibilityLabel,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const color = active ? theme.colors.accent : theme.colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={loading}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.accent} size="small" />
      ) : (
        <Ionicons color={color} name={icon} size={20 * scaleFont} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
