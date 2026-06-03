import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { LanguageItem } from "../../src/components/settings/language-item";
import { NetworkStateDebugItem } from "../../src/components/settings/network-state-debug-item";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { SettingsRow } from "../../src/components/settings/settings-row";
import { SettingsSection } from "../../src/components/settings/settings-section";
import { ThemePaletteItem } from "../../src/components/settings/theme-palette-item";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function SettingsScreen() {
  const { t } = useTranslation(["settings", "common"]);
  const { isSignedIn, email, fullName, signOut } = useClerkAuth();
  const { theme, tenantName } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          {
            gap: 24 * scaleSpace,
            paddingBottom: tabBarSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
            {tenantName}
          </Text>
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {t("settings:title")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t("settings:subtitle")}
          </Text>
        </View>

        <SettingsSection title={t("settings:sections.general")}>
          <LanguageItem />
          <ThemePaletteItem isLast />
        </SettingsSection>

        <SettingsSection title={t("settings:sections.account")}>
          {isSignedIn ? (
            <>
              <SettingsRow
                label={t("settings:account.signedInAs")}
                value={fullName ?? email ?? "—"}
              />
              <SettingsRow
                label={t("settings:account.signOut")}
                danger
                isLast
                onPress={() => void signOut()}
              />
            </>
          ) : (
            <>
              <SettingsRow
                label={t("settings:account.status")}
                value={t("settings:account.guest")}
              />
              <SettingsRow
                label={t("settings:account.memberFeatures")}
                description={t("settings:account.memberFeaturesDescription")}
                isLast
              />
            </>
          )}
        </SettingsSection>

        {__DEV__ ? (
          <SettingsSection title={t("settings:sections.debug")}>
            <NetworkStateDebugItem isLast />
          </SettingsSection>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    gap: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 560,
  },
});
