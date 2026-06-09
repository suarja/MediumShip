import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { HapticsService } from "../../features/haptics/haptics";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type PremiumPaywallProps = {
  // Screen-specific copy (from the article/episode/video namespace).
  title: string;
  description: string;
  ctaLabel: string;
};

// Themed paywall shown on premium content for non-members. Recreates the visual
// intent of the mockup Paywall screen (eyebrow → headline → benefits → CTA)
// entirely from theme tokens so it tracks every palette, including `midnight`.
//
// Guest-first: a guest gets a sign-in CTA; a signed-in non-member gets an
// informational note (membership is granted by the team — no self-serve
// purchase flow yet).
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
      <Text style={[styles.title, { color: theme.colors.heading }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: theme.colors.text }]}>
        {description}
      </Text>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <Text
            key={benefit}
            style={[styles.benefit, { color: theme.colors.textMuted }]}
          >
            ✓ {benefit}
          </Text>
        ))}
      </View>

      {isSignedIn ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void HapticsService.medium();
              openPaywall("content");
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
              {ctaLabel}
            </Text>
          </Pressable>
          <View
            style={[
              styles.pending,
              {
                borderTopColor: withAlpha(theme.colors.premium, 0.32),
              },
            ]}
          >
            <Text style={[styles.pendingTitle, { color: theme.colors.heading }]}>
              {t("paywallMemberPendingTitle")}
            </Text>
            <Text style={[styles.pendingBody, { color: theme.colors.textMuted }]}>
              {t("paywallMemberPendingBody")}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Link href="/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
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
              <Text
                style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}
              >
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
  pending: {
    gap: 4,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pendingTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  pendingBody: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
  },
});
