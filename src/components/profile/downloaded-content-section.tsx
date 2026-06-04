import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useIsMember } from "../../features/membership/use-is-member";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { SettingsRow } from "../settings/settings-row";
import { SettingsSection } from "../settings/settings-section";

const KIND_GLYPHS = {
  article: "✎",
  episode: "▷",
  video: "▶",
} as const;

export function DownloadedContentSection() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { downloads, isLoading } = useDownloads({ enabled: isSignedIn && isMember });
  const router = useRouter();

  return (
    <SettingsSection title={t("downloads.sectionTitle")}>
      {isMembershipLoading || isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("downloads.loading")}
          </Text>
        </View>
      ) : !isSignedIn ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("downloads.guestHint")}
          </Text>
        </View>
      ) : !isMember ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("downloads.memberHint")}
          </Text>
        </View>
      ) : downloads.length === 0 ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {t("downloads.empty")}
          </Text>
        </View>
      ) : (
        downloads.map((download, index) => (
          <SettingsRow
            key={download.content._id}
            label={download.content.title}
            description={t("downloads.rowDescription", {
              kind: t(`kinds.${download.content.kind}`),
              category: download.content.category,
            })}
            icon={
              <Text style={[styles.icon, { color: theme.colors.heading }]}>
                {KIND_GLYPHS[download.content.kind]}
              </Text>
            }
            isLast={index === downloads.length - 1}
            onPress={() => {
              router.push(`/${download.content.kind}/${download.content._id}` as never);
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
