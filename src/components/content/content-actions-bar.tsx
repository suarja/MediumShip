import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import type { ContentDoc } from "../../features/content/types";
import { getDownloadSupport } from "../../features/downloads/model";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export function ContentActionsBar({ content }: { content: ContentDoc }) {
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
  const {
    downloadedItem,
    isLoading: isDownloadsLoading,
    isDownloading,
    downloadContent,
  } = useDownloads({
    contentId: content._id,
    enabled: isSignedIn && isMember,
  });

  const isSaved = bookmarks.some((bookmark) => bookmark.content._id === content._id);
  const downloadSupport = getDownloadSupport(content);

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
              {t("actions.signInCta")}
            </Text>
          </Pressable>
        </Link>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("actions.signInHint")}
        </Text>
      </View>
    );
  }

  if (isMembershipLoading || isBookmarksLoading || isDownloadsLoading) {
    return (
      <View style={styles.stack}>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("actions.loading")}
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
              {t("actions.memberCta")}
            </Text>
          </Pressable>
        </Link>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t("actions.memberHint")}
        </Text>
      </View>
    );
  }

  const downloadDisabled =
    Boolean(downloadedItem) ||
    isDownloading ||
    downloadSupport.kind === "unsupported";
  const downloadLabel = downloadedItem
    ? t("download.downloadedCta")
    : isDownloading
      ? t("download.downloadingCta")
      : downloadSupport.kind === "unsupported"
        ? downloadSupport.reason === "youtube"
          ? t("download.youtubeCta")
          : t("download.unavailableCta")
        : t("download.downloadCta");
  const downloadHint =
    downloadSupport.kind === "unsupported" && downloadSupport.reason === "youtube"
      ? t("download.youtubeHint")
      : downloadedItem
        ? t("download.downloadedHint")
        : t("download.memberHint");

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void toggleBookmark({ contentId: content._id as never })}
          style={({ pressed }) => [
            styles.memberButton,
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

        <Pressable
          accessibilityRole="button"
          disabled={downloadDisabled}
          onPress={() => void downloadContent(content)}
          style={({ pressed }) => [
            styles.memberButton,
            {
              borderRadius: theme.radii.pill,
              backgroundColor: downloadedItem
                ? theme.colors.premiumSoft
                : theme.colors.surface,
              borderColor: theme.colors.border,
            },
            styles.outlinedButton,
            pressed && !downloadDisabled && styles.pressed,
            downloadDisabled && styles.disabled,
          ]}
        >
          <Text style={[styles.secondaryLabel, { color: theme.colors.heading }]}>
            {downloadLabel}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        {downloadHint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
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
  memberButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  outlinedButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  primaryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    textAlign: "center",
  },
  secondaryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    textAlign: "center",
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
  disabled: {
    opacity: 0.7,
  },
});
