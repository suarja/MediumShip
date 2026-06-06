import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import type { ContentDoc } from "../../features/content/types";
import { getDownloadSupport } from "../../features/downloads/model";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export function ContentActionsBar({ content }: { content: ContentDoc }) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
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
      <MembershipActionCard
        body={t("actions.signInHint")}
        ctaHref="/sign-in"
        ctaLabel={t("actions.signInCta")}
        iconName="person-circle-outline"
      />
    );
  }

  if (isMembershipLoading || isBookmarksLoading || isDownloadsLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>
          {t("actions.loading")}
        </Text>
      </View>
    );
  }

  const bookmarkAction = (
    <ActionCard
      body={isSaved ? t("bookmark.savedHint") : t("bookmark.saveHint")}
      ctaLabel={isSaved ? t("bookmark.savedCta") : t("bookmark.saveCta")}
      iconName={isSaved ? "bookmark" : "bookmark-outline"}
      onPress={() => void toggleBookmark({ contentId: content._id as never })}
      tone="accent"
    />
  );

  if (!isMember) {
    return (
      <View style={[styles.stack, { gap: theme.spacing.sm * scaleSpace }]}>
        {bookmarkAction}
        <MembershipActionCard
          body={t("actions.memberHint")}
          ctaHref="/premium"
          ctaLabel={t("actions.memberCta")}
          iconName="sparkles-outline"
        />
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
      : downloadSupport.kind === "unsupported"
        ? t("download.unavailableHint")
        : downloadedItem
          ? t("download.downloadedHint")
          : t("download.downloadHint");

  return (
    <View style={[styles.stack, { gap: theme.spacing.sm * scaleSpace }]}>
      <View style={[styles.row, { gap: theme.spacing.sm * scaleSpace }]}>
        {bookmarkAction}
        <ActionCard
          body={downloadHint}
          ctaLabel={downloadLabel}
          disabled={downloadDisabled}
          iconName={
            downloadedItem
              ? "download"
              : downloadSupport.kind === "unsupported"
                ? "cloud-offline-outline"
                : "download-outline"
          }
          onPress={() => void downloadContent(content)}
          tone={downloadedItem ? "premium" : "accent"}
        />
      </View>
      <Text
        style={[
          styles.footerHint,
          { color: withAlpha(theme.colors.textMuted, 0.92), fontSize: 12 * scaleFont },
        ]}
      >
        {isTablet ? t("actions.memberFooterWide") : t("actions.memberFooter")}
      </Text>
    </View>
  );
}

function MembershipActionCard({
  body,
  ctaHref,
  ctaLabel,
  iconName,
}: {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <Link href={ctaHref as never} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => [pressed && styles.pressed]}>
        <View
          style={[
            styles.membershipCard,
            {
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.sm * scaleSpace,
              padding: theme.spacing.md * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.membershipIconWrap,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accentSoft,
              },
            ]}
          >
            <Ionicons color={theme.colors.accent} name={iconName} size={20 * scaleFont} />
          </View>
          <View style={[styles.membershipCopy, { gap: 4 * scaleSpace }]}>
            <Text
              style={[
                styles.membershipTitle,
                { color: theme.colors.heading, fontSize: 15 * scaleFont },
              ]}
            >
              {ctaLabel}
            </Text>
            <Text
              style={[
                styles.membershipBody,
                { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
              ]}
            >
              {body}
            </Text>
          </View>
          <Ionicons
            color={theme.colors.textMuted}
            name="chevron-forward"
            size={18 * scaleFont}
          />
        </View>
      </Pressable>
    </Link>
  );
}

function ActionCard({
  body,
  ctaLabel,
  disabled = false,
  iconName,
  onPress,
  tone,
}: {
  body: string;
  ctaLabel: string;
  disabled?: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone: "accent" | "premium";
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
        styles.actionCard,
        {
          borderRadius: theme.radii.xl,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          gap: theme.spacing.sm * scaleSpace,
          padding: theme.spacing.md * scaleSpace,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          {
            borderRadius: theme.radii.pill,
            backgroundColor: withAlpha(color, 0.12),
          },
        ]}
      >
        <Ionicons color={color} name={iconName} size={20 * scaleFont} />
      </View>
      <View style={[styles.actionCopy, { gap: 4 * scaleSpace }]}>
        <Text
          style={[
            styles.actionTitle,
            { color: theme.colors.heading, fontSize: 15 * scaleFont },
          ]}
        >
          {ctaLabel}
        </Text>
        <Text
          style={[
            styles.actionBody,
            { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
          ]}
        >
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {},
  row: {
    flexDirection: "row",
  },
  loadingWrap: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
  },
  membershipCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  membershipIconWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipCopy: {
    flex: 1,
  },
  membershipTitle: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  membershipBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  actionCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  actionBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  footerHint: {
    fontFamily: fontFamilies.body,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.68,
  },
});
