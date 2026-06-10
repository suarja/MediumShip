import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fontFamilies } from "../../features/theme/fonts";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";
import { usePermissionStatus, useRequestPermission } from "../../features/notifications/permission";
import { scheduleDailyDigest } from "../../features/notifications/schedule-daily-digest";
import { useDigestReminderSettings } from "../../features/notifications/use-digest-reminder-settings";
import { SettingsRow } from "./settings-row";

export function DailyDigestToggle({ isLast = false }: { isLast?: boolean }) {
  const { t, i18n } = useTranslation("notifications");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const { status } = usePermissionStatus();
  const { requestPermissionExplicit, openSettings } = useRequestPermission();
  const { enabled, hour, isLoading, setEnabled } = useDigestReminderSettings();
  const [busy, setBusy] = useState(false);

  const handleToggle = useCallback(
    async (nextEnabled: boolean) => {
      if (busy || isLoading) {
        return;
      }

      if (!nextEnabled) {
        await setEnabled(false);
        return;
      }

      setBusy(true);
      try {
        const permission = await requestPermissionExplicit({ showRationale: true });
        if (permission !== "granted") {
          return;
        }

        await setEnabled(true);
        if (Platform.OS !== "web") {
          await scheduleDailyDigest({
            hour,
            locale: i18n.language,
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, hour, i18n.language, isLoading, requestPermissionExplicit, setEnabled],
  );

  const statusLabel = enabled ? t("dailyDigest.enabled") : t("dailyDigest.disabled");
  const denied = status === "denied";

  return (
    <View>
      <SettingsRow
        label={t("dailyDigest.title")}
        description={t("dailyDigest.subtitle")}
        value={statusLabel}
        isLast={!denied && isLast}
      >
        <Switch
          accessibilityRole="switch"
          accessibilityLabel={t("dailyDigest.title")}
          disabled={busy || isLoading || denied}
          value={enabled}
          onValueChange={(next) => void handleToggle(next)}
          trackColor={{
            false: theme.colors.surfaceMuted,
            true: theme.colors.accent,
          }}
          thumbColor={theme.colors.surface}
          ios_backgroundColor={theme.colors.surfaceMuted}
        />
      </SettingsRow>

      {denied ? (
        <View
          style={[
            styles.deniedBanner,
            {
              gap: 8 * scaleSpace,
              paddingHorizontal: 18,
              paddingBottom: 14 * scaleSpace,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.deniedCopy, { color: theme.colors.textMuted }]}>
            {t("dailyDigest.permissionDenied")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={openSettings}
            style={({ pressed }) => [
              styles.settingsLink,
              {
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.surfaceMuted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.settingsLinkLabel, { color: theme.colors.accent }]}>
              {t("dailyDigest.openSettings")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deniedBanner: {
    paddingTop: 0,
  },
  deniedCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
  },
  settingsLink: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsLinkLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
});
