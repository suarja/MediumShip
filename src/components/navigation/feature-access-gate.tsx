import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { FeatureKey } from "../../../convex/featureCatalog";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { useFeatureAccess } from "../../features/tenant/use-feature-access";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export function FeatureAccessGate({
  featureKey,
  children,
}: {
  featureKey: FeatureKey;
  children: ReactNode;
}) {
  const { t } = useTranslation("features");
  const { theme } = useAppTheme();
  const { openPaywall } = usePaywallSheet();
  const { enabled, canAccess, isLoading, requiresSignIn, requiresPremium } =
    useFeatureAccess(featureKey);

  if (!enabled) {
    return (
      <View style={styles.center}>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {t("unavailable")}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {t("loading")}
        </Text>
      </View>
    );
  }

  if (canAccess) {
    return <>{children}</>;
  }

  if (requiresSignIn) {
    return (
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{t("memberTitle")}</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {t("memberBody")}
        </Text>
        <Link asChild href="/sign-in">
          <Pressable
            accessibilityRole="button"
            style={[
              styles.cta,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accent,
              },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
              {t("signIn")}
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (requiresPremium) {
    return (
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{t("premiumTitle")}</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {t("premiumBody")}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openPaywall("content")}
          style={[
            styles.cta,
            {
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
            {t("upgrade")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>
        {t("unavailable")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    textAlign: "center",
  },
  message: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
