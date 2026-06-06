import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import type { ContentDoc } from "../../features/content/types";
import { getDownloadSupport } from "../../features/downloads/model";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useContentActionsSheet } from "../../features/content/content-actions-sheet-provider";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { hasCapability } from "../../features/tenant/public-config";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

// Compact sticky footer for content detail: Keep, Offline, and List pills.
// Premium capabilities that need membership route through the paywall sheet;
// list membership opens the add-to-list sheet.
export function ContentActionsBar({ content }: { content: ContentDoc }) {
  const { t } = useTranslation("library");
  const { theme, enabledModules } = useAppTheme();
  const canBookmark = hasCapability(enabledModules, "bookmarks");
  const canPersonalLists = hasCapability(enabledModules, "personalLists");
  const canOffline = hasCapability(enabledModules, "offline");
  const { scaleSpace } = useResponsive();
  const router = useRouter();
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
  const { openPaywall } = usePaywallSheet();
  const { openContentActions } = useContentActionsSheet();
  const listMembership = useQuery(
    api.personalLists.queries.listMineForContent,
    isSignedIn && canPersonalLists
      ? { contentId: content._id as Id<"contents"> }
      : "skip",
  );
  const isInList =
    Array.isArray(listMembership) &&
    listMembership.some((list) => list.contains);

  const isSaved = bookmarks.some((bookmark) => bookmark.content._id === content._id);
  const downloadSupport = getDownloadSupport(content);

  // Bookmark — free for any signed-in account; a guest is routed to sign-in.
  const bookmarkPill = (
    <ActionPill
      active={isSaved}
      iconName={isSaved ? "bookmark" : "bookmark-outline"}
      label={isSaved ? t("bookmark.savedCta") : t("bookmark.saveCta")}
      onPress={
        isSignedIn
          ? () => void toggleBookmark({ contentId: content._id as never })
          : () => router.push("/sign-in")
      }
    />
  );

  // Offline — real download for members; everyone else gets the paywall sheet,
  // which itself routes a guest to sign-in.
  let offlinePill: ReactNode;
  if (isSignedIn && isMember) {
    const unsupported = downloadSupport.kind === "unsupported";
    const youtube = unsupported && downloadSupport.reason === "youtube";
    const label = downloadedItem
      ? t("download.downloadedCta")
      : isDownloading
        ? t("download.downloadingCta")
        : youtube
          ? t("download.youtubeCta")
          : unsupported
            ? t("download.unavailableCta")
            : t("download.downloadCta");
    offlinePill = (
      <ActionPill
        active={Boolean(downloadedItem)}
        disabled={Boolean(downloadedItem) || isDownloading || unsupported}
        iconName={
          downloadedItem
            ? "download"
            : unsupported
              ? "cloud-offline-outline"
              : "download-outline"
        }
        label={label}
        onPress={() => void downloadContent(content)}
        tone="premium"
      />
    );
  } else {
    offlinePill = (
      <ActionPill
        iconName="download-outline"
        label={t("download.downloadCta")}
        onPress={() => openPaywall("offline")}
      />
    );
  }

  const isLoading =
    isSignedIn && (isMembershipLoading || isBookmarksLoading || isDownloadsLoading);

  const listPill = canPersonalLists ? (
    <ActionPill
      active={isInList}
      iconName={isInList ? "list" : "list-outline"}
      label={isInList ? t("list.inListCta") : t("list.addCta")}
      onPress={() => {
        if (!isSignedIn) {
          router.push("/sign-in");
          return;
        }
        openContentActions(content._id as Id<"contents">, "lists");
      }}
    />
  ) : null;

  if (!canBookmark && !canOffline && !canPersonalLists) {
    return null;
  }

  return (
    <View
      style={[styles.row, { gap: theme.spacing.sm * scaleSpace, opacity: isLoading ? 0.6 : 1 }]}
    >
      {canBookmark ? bookmarkPill : null}
      {canOffline ? offlinePill : null}
      {listPill}
    </View>
  );
}

function ActionPill({
  iconName,
  label,
  onPress,
  active = false,
  disabled = false,
  tone = "accent",
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "accent" | "premium";
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const color = tone === "premium" ? theme.colors.premium : theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          borderRadius: theme.radii.pill,
          borderColor: active ? color : theme.colors.border,
          backgroundColor: active ? withAlpha(color, 0.12) : theme.colors.surface,
          paddingVertical: 10 * scaleSpace,
          paddingHorizontal: 14 * scaleSpace,
          gap: 8 * scaleSpace,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        color={active ? color : theme.colors.heading}
        name={iconName}
        size={18 * scaleFont}
      />
      <Text
        style={[
          styles.pillLabel,
          { color: active ? color : theme.colors.heading, fontSize: 13 * scaleFont },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.6,
  },
});
