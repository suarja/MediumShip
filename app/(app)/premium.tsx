import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { HapticsService } from "../../src/features/haptics/haptics";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { useStartFreePremium } from "../../src/features/billing/use-start-free-premium";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { PAYMENTS_ENABLED } from "../../src/features/tenant/feature-access";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function PremiumScreen() {
  const { t } = useTranslation("premium");
  const { theme, tenantName } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { isMember: isPremium } = useIsMember();
  const { openPaywall, showPurchaseCelebration } = usePaywallSheet();
  const paymentsEnabled = PAYMENTS_ENABLED;
  const { activate: activateFreePremium, isPending: isFreePremiumPending } =
    useStartFreePremium({
      onSuccess: showPurchaseCelebration,
    });

  return (
    <Screen>
      <View
        style={[
          styles.card,
          {
            borderRadius: theme.radii.lg,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{tenantName}</Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{t("title")}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t("subtitle")}
        </Text>

        {isPremium ? (
          <Text style={[styles.note, { color: theme.colors.accent }]}>
            {t("paywallTrialNote")}
          </Text>
        ) : isSignedIn ? (
          <Pressable
            accessibilityRole="button"
            testID={
              paymentsEnabled ? "premium-screen-subscribe-cta" : "premium-screen-free-cta"
            }
            disabled={!paymentsEnabled && isFreePremiumPending}
            onPress={() => {
              void HapticsService.medium();
              if (paymentsEnabled) {
                openPaywall("support");
                return;
              }
              void activateFreePremium();
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.premium,
                opacity: pressed || isFreePremiumPending ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
              {paymentsEnabled ? t("paywallSubscribeCta") : t("freeTrialCta")}
            </Text>
          </Pressable>
        ) : (
          <Link href="/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
              testID="premium-screen-sign-in-cta"
              onPress={() => void HapticsService.medium()}
              style={({ pressed }) => [
                styles.cta,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.premium,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
                {t("paywallGuestHint")}
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    marginTop: 8,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
  note: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    textAlign: "center",
  },
});
