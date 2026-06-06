import { Link } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import type { PaywallReason } from "../../features/paywall/paywall-copy";
import { resolvePaywallCopyKeys } from "../../features/paywall/paywall-copy";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  visible: boolean;
  reason: PaywallReason;
  isSignedIn: boolean;
  onDismiss: () => void;
};

// Contextual paywall bottom sheet. Uses the RN Modal's native `slide`
// animation and a flush flex-end layout (mirroring the proven `../editia/mobile`
// `ui/Modal`), instead of a manual spring — the spring's overshoot was leaving a
// gap below the sheet. The sheet always carries a primary call to action:
// guest -> sign-in, signed-in non-member -> the membership surface.
export function PaywallSheet({ visible, reason, isSignedIn, onDismiss }: Props) {
  const { t } = useTranslation("paywall");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const insets = useSafeAreaInsets();

  const keys = resolvePaywallCopyKeys(reason);
  const benefits = t("benefits", { returnObjects: true }) as string[];
  const maxWidth = isTablet ? 520 : undefined;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: withAlpha(theme.colors.canvas, 0.72) }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.canvas,
              borderTopLeftRadius: theme.radii.xl,
              borderTopRightRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 24 * scaleSpace,
              alignSelf: "center",
              width: maxWidth ?? "100%",
            },
          ]}
        >
          <View style={styles.grab}>
            <View
              style={[styles.grabBar, { backgroundColor: withAlpha(theme.colors.heading, 0.2) }]}
            />
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { gap: 16 * scaleSpace }]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.crest,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.2 : 0.1),
                },
              ]}
            >
              <Text style={[styles.crestLabel, { color: theme.colors.accent, fontSize: 22 * scaleFont }]}>
                {t("crestFallback")}
              </Text>
            </View>

            <Text style={[styles.eyebrow, { color: theme.colors.accent, fontSize: 11 * scaleFont }]}>
              {t(keys.eyebrow)}
            </Text>

            <Text style={[styles.headline, { color: theme.colors.heading, fontSize: 26 * scaleFont }]}>
              {t(keys.title)}
            </Text>

            <Text
              style={[styles.description, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}
            >
              {t(keys.description)}
            </Text>

            <View style={[styles.benefits, { gap: 10 * scaleSpace }]}>
              {Array.isArray(benefits) &&
                benefits.map((benefit, i) => (
                  <View key={i} style={[styles.benefitRow, { gap: 10 * scaleSpace }]}>
                    <Text style={[styles.checkmark, { color: theme.colors.accent, fontSize: 14 * scaleFont }]}>
                      ✓
                    </Text>
                    <Text style={[styles.benefitLabel, { color: theme.colors.text, fontSize: 14 * scaleFont }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
            </View>

            {isSignedIn ? (
              <>
                <Link href="/premium" asChild>
                  <Pressable
                    accessibilityRole="link"
                    onPress={onDismiss}
                    style={({ pressed }) => [
                      styles.primaryCta,
                      {
                        borderRadius: theme.radii.pill,
                        backgroundColor: theme.colors.premium,
                        paddingVertical: 14 * scaleSpace,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[styles.primaryCtaLabel, { color: theme.colors.accentContrast, fontSize: 15 * scaleFont }]}
                    >
                      {t("becomeMemberCta")}
                    </Text>
                  </Pressable>
                </Link>
                <Text style={[styles.pendingBody, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
                  {t("pendingBody")}
                </Text>
              </>
            ) : (
              <Link href="/sign-in" asChild>
                <Pressable
                  accessibilityRole="link"
                  onPress={onDismiss}
                  style={({ pressed }) => [
                    styles.primaryCta,
                    {
                      borderRadius: theme.radii.pill,
                      backgroundColor: theme.colors.accent,
                      paddingVertical: 14 * scaleSpace,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.primaryCtaLabel, { color: theme.colors.accentContrast, fontSize: 15 * scaleFont }]}
                  >
                    {t("signInCta")}
                  </Text>
                </Pressable>
              </Link>
            )}

            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={[styles.dismissLabel, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
                {t("dismissCta")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    flexShrink: 1,
    maxHeight: "90%",
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  grab: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  crest: {
    alignSelf: "center",
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  crestLabel: {
    fontFamily: fontFamilies.display,
    fontWeight: "700",
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  headline: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  description: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
    textAlign: "center",
  },
  benefits: {},
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkmark: {
    fontFamily: fontFamilies.body,
    width: 20,
  },
  benefitLabel: {
    fontFamily: fontFamilies.body,
    flex: 1,
    lineHeight: 20,
  },
  primaryCta: {
    alignItems: "center",
  },
  primaryCtaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  pendingBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
    textAlign: "center",
  },
  dismissLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
  },
});
