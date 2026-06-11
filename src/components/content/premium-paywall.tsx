import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { logBilling } from "../../features/billing/billing-debug";
import { HapticsService } from "../../features/haptics/haptics";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type PremiumPaywallProps = {
  title: string;
  description: string;
  ctaLabel: string;
};

// Inline premium gate on article/episode/video detail. Tapping the CTA opens the
// RevenueCat paywall bottom sheet (IAP on native, guidance on web).
export function PremiumPaywall({
  title,
  description,
  ctaLabel,
}: PremiumPaywallProps) {
  const { theme } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { openPaywall } = usePaywallSheet();
  const { t } = useTranslation("premium");

  const benefits = t("paywallBenefits", { returnObjects: true }) as string[];
  const subscribeLabel = isSignedIn ? t("paywallSubscribeCta") : ctaLabel;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.premiumSoft,
          borderColor: theme.colors.premium,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.colors.premium }]}>
        ◉ {t("paywallEyebrow")}
      </Text>
      <Text style={[styles.title, { color: theme.colors.heading }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.colors.text }]}>{description}</Text>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <Text key={benefit} style={[styles.benefit, { color: theme.colors.textMuted }]}>
            ✓ {benefit}
          </Text>
        ))}
      </View>

      <Text style={[styles.trialNote, { color: theme.colors.textMuted }]}>
        {t("paywallTrialNote")}
      </Text>

      {isSignedIn ? (
        <Pressable
          accessibilityRole="button"
          testID="premium-paywall-subscribe-cta"
          onPress={() => {
            void HapticsService.medium();
            logBilling("premium_paywall.cta.tap", { surface: "inline", isSignedIn: true });
            openPaywall("content", { previewTitle: title });
          }}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: theme.colors.premium,
              borderRadius: theme.radii.pill,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
            {subscribeLabel}
          </Text>
        </Pressable>
      ) : (
        <>
          <Link href="/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
              testID="premium-paywall-sign-in-cta"
              onPress={() => void HapticsService.medium()}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.colors.premium,
                  borderRadius: theme.radii.pill,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
                {ctaLabel}
              </Text>
            </Pressable>
          </Link>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            {t("paywallGuestHint")}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 19,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  benefits: {
    gap: 4,
    marginTop: 2,
  },
  benefit: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  trialNote: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
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
});
