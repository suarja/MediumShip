import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "../../../convex/_generated/dataModel";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import type { ContentActionsFocus } from "../../features/content/content-actions-sheet-provider";
import { useContentActionsSheet } from "../../features/content/content-actions-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
};

/** Inline like toggle for the discovery feature card. */
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
    <CardActionButton
      testID="discover-like-button"
      icon={isLiked ? "heart" : "heart-outline"}
      label={accessibilityLabel}
      active={isLiked}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

/** Inline bookmark (Favoris) toggle for the discovery feature card. */
export function ContentCardFavoriteAction({
  contentId,
  accessibilityLabel,
  savedAccessibilityLabel,
}: {
  contentId: Id<"contents">;
  accessibilityLabel: string;
  savedAccessibilityLabel: string;
}) {
  const { isSignedIn } = useClerkAuth();
  const { bookmarks, toggleBookmark, isBookmarksLoading } = useBookmarks();
  const isSaved = bookmarks.some((bookmark) => bookmark.content._id === contentId);

  return (
    <CardActionButton
      testID="discover-favorite-button"
      icon={isSaved ? "bookmark" : "bookmark-outline"}
      label={isSaved ? savedAccessibilityLabel : accessibilityLabel}
      active={isSaved}
      loading={isSignedIn && isBookmarksLoading}
      onPress={() => {
        if (!isSignedIn) {
          return;
        }
        void toggleBookmark({ contentId });
      }}
      accessibilityLabel={isSaved ? savedAccessibilityLabel : accessibilityLabel}
    />
  );
}

/** Opens the shared content actions sheet from the discovery card. */
export function ContentCardOverflowAction({
  contentId,
  focus = "discovery",
  accessibilityLabel,
}: {
  contentId: Id<"contents">;
  focus?: ContentActionsFocus;
  accessibilityLabel: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const { openContentActions } = useContentActionsSheet();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID="discover-overflow-button"
      hitSlop={8}
      onPress={() => openContentActions(contentId, focus)}
      style={({ pressed }) => [
        styles.overflowButton,
        {
          borderRadius: theme.radii.sm,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        color={theme.colors.textMuted}
        name="ellipsis-horizontal"
        size={18 * scaleFont}
      />
    </Pressable>
  );
}

function CardActionButton({
  icon,
  label,
  active = false,
  loading = false,
  onPress,
  accessibilityLabel,
  testID,
}: ActionButtonProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          gap: 6 * scaleSpace,
          borderRadius: theme.radii.md,
          backgroundColor: active
            ? withAlpha(theme.colors.accent, 0.12)
            : withAlpha(theme.colors.heading, 0.03),
          paddingHorizontal: 12 * scaleSpace,
          paddingVertical: 8 * scaleSpace,
        },
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.accent} size="small" />
      ) : (
        <Ionicons
          color={active ? theme.colors.accent : theme.colors.textMuted}
          name={icon}
          size={18 * scaleFont}
        />
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.actionLabel,
          {
            color: active ? theme.colors.accent : theme.colors.textMuted,
            fontSize: 12 * scaleFont,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    flexShrink: 1,
  },
  overflowButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.72,
  },
});
