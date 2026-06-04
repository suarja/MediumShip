import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { SettingsRow } from "../settings/settings-row";
import { SettingsSection } from "../settings/settings-section";

const KIND_GLYPHS = {
  article: "✎",
  episode: "▷",
  video: "▶",
} as const;

export function SavedContentSection() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { bookmarks, isMember, isMembershipLoading, isBookmarksLoading } = useBookmarks();
  const router = useRouter();

  return (
    <SettingsSection title={t("saved.sectionTitle")}>
      {isMembershipLoading || isBookmarksLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("saved.loading")}
          </Text>
        </View>
      ) : !isSignedIn ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("saved.guestHint")}
          </Text>
        </View>
      ) : !isMember ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("saved.memberHint")}
          </Text>
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("saved.empty")}
          </Text>
        </View>
      ) : (
        bookmarks.map((bookmark, index) => (
          <SettingsRow
            key={bookmark.content._id}
            label={bookmark.content.title}
            description={t("saved.rowDescription", {
              kind: t(`kinds.${bookmark.content.kind}`),
              category: bookmark.content.category,
            })}
            icon={
              <Text style={[styles.icon, { color: theme.colors.heading }]}>
                {KIND_GLYPHS[bookmark.content.kind]}
              </Text>
            }
            isLast={index === bookmarks.length - 1}
            onPress={() => {
              router.push(`/${bookmark.content.kind}/${bookmark.content._id}` as never);
            }}
          />
        ))
      )}
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  messageWrap: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  message: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  icon: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
  },
});
