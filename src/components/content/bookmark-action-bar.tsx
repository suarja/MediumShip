import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";

export function BookmarkActionBar({ contentId }: { contentId: string }) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const {
    bookmarks,
    isMember,
    isMembershipLoading,
    isBookmarksLoading,
    toggleBookmark,
  } = useBookmarks();

  const isSaved = bookmarks.some((bookmark) => bookmark.content._id === contentId);

  if (!isSignedIn) {
    return (
      <View style={styles.stack}>
        <Link href="/sign-in" asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.primaryButton,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accent,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.primaryLabel, { color: theme.colors.accentContrast }]}>
              {t("bookmark.signInCta")}
            </Text>
          </Pressable>
        </Link>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("bookmark.signInHint")}
        </Text>
      </View>
    );
  }

  if (isMembershipLoading || isBookmarksLoading) {
    return (
      <View style={styles.stack}>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("bookmark.loading")}
        </Text>
      </View>
    );
  }

  if (!isMember) {
    return (
      <View style={styles.stack}>
        <Link href="/premium" asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderRadius: theme.radii.pill,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.secondaryLabel, { color: theme.colors.heading }]}>
              {t("bookmark.memberCta")}
            </Text>
          </Pressable>
        </Link>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("bookmark.memberHint")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => void toggleBookmark({ contentId: contentId as never })}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            borderRadius: theme.radii.pill,
            backgroundColor: isSaved ? theme.colors.premium : theme.colors.accent,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.primaryLabel,
            {
              color: isSaved ? theme.colors.heading : theme.colors.accentContrast,
            },
          ]}
        >
          {isSaved ? t("bookmark.savedCta") : t("bookmark.saveCta")}
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        {isSaved ? t("bookmark.savedHint") : t("bookmark.memberHint")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  primaryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  secondaryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
  },
});
