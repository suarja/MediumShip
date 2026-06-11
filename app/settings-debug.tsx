import { useGoBack } from "../src/features/navigation/app-navigation";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../convex/_generated/api";
import { HapticsService } from "../src/features/haptics/haptics";
import { resetOnboardingSeen } from "../src/features/onboarding/onboarding-storage";
import { StatusBannerStack } from "../src/components/content/status-banner-stack";
import { Screen } from "../src/components/layout/screen";
import { useTabBarSpace } from "../src/components/navigation/app-tab-bar";
import { NetworkStateDebugItem } from "../src/components/settings/network-state-debug-item";
import { SettingsRow } from "../src/components/settings/settings-row";
import { SettingsSection } from "../src/components/settings/settings-section";
import { useClerkAuth } from "../src/features/auth/use-clerk-auth";
import { usePersistentMediaPlayerSpace } from "../src/features/media/persistent-media-player";
import { useIsMember } from "../src/features/membership/use-is-member";
import { useNetworkStatus } from "../src/features/network/use-network-status";
import { fontFamilies } from "../src/features/theme/fonts";
import { useAppTheme } from "../src/features/theme/theme-provider";

export default function SettingsDebugScreen() {
  const { t } = useTranslation("settings");
  const { theme } = useAppTheme();
  const goBack = useGoBack("/settings");
  const router = useRouter();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const { isSignedIn, userId, email, fullName, user } = useClerkAuth();
  const { isAuthenticated } = useConvexAuth();
  const { isMember } = useIsMember();
  const { state: networkState } = useNetworkStatus();
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: tabBarSpace + persistentPlayerSpace },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={[styles.backLabel, { color: theme.colors.accent }]}>
              {t("debug.back")}
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.heading }]}>{t("debug.title")}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t("debug.subtitle")}
          </Text>
        </View>

        <StatusBannerStack networkState={networkState} />

        <SettingsSection title={t("debug.sections.session")}>
          <SettingsRow label={t("debug.rows.auth")} value={isSignedIn ? "signed-in" : "guest"} />
          <SettingsRow label={t("debug.rows.convex")} value={isAuthenticated ? "ready" : "guest"} />
          <SettingsRow label={t("debug.rows.member")} value={isMember ? "pro" : "no"} />
          <SettingsRow label={t("debug.rows.userId")} value={userId ?? "—"} />
          <SettingsRow label={t("debug.rows.name")} value={fullName ?? "—"} />
          <SettingsRow isLast label={t("debug.rows.email")} value={email ?? "—"} />
        </SettingsSection>

        <SettingsSection title={t("debug.sections.identity")}>
          <SettingsRow label={t("debug.rows.stored")} value={me?.isStored ? "yes" : "no"} />
          <SettingsRow label={t("debug.rows.clerkId")} value={me?.clerkId ?? "—"} />
          <SettingsRow label={t("debug.rows.tokenIdentifier")} value={me?.tokenIdentifier ?? "—"} />
          <SettingsRow label={t("debug.rows.avatar")} value={user?.imageUrl ?? me?.avatarUrl ?? "—"} />
          <SettingsRow isLast label={t("debug.rows.displayName")} value={me?.name ?? "—"} />
        </SettingsSection>

        <SettingsSection title={t("debug.sections.network")}>
          <NetworkStateDebugItem />
          <SettingsRow isLast label={t("debug.rows.networkRuntime")} value={networkState} />
        </SettingsSection>

        <SettingsSection title={t("debug.sections.onboarding")}>
          <Pressable
            accessibilityRole="button"
            testID="debug-replay-onboarding"
            onPress={async () => {
              void HapticsService.medium();
              await resetOnboardingSeen();
              router.replace("/onboarding");
            }}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <Text style={[styles.actionLabel, { color: theme.colors.accent }]}>
              {t("debug.onboarding.replay")}
            </Text>
            <Text style={[styles.actionHint, { color: theme.colors.textMuted }]}>
              {t("debug.onboarding.replayHint")}
            </Text>
          </Pressable>
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 560,
  },
  actionRow: {
    paddingVertical: 10,
    gap: 2,
  },
  actionLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
  },
  actionHint: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.84,
  },
});
