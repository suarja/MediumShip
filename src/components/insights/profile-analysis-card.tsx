import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useFeatureAccess } from "../../features/tenant/use-feature-access";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ProfileAnalysisCardProps = {
  state: "loading" | "locked" | "ready" | "empty";
  previewText?: string;
  onOpen?: () => void;
  onOpenHistory?: () => void;
};

export function ProfileAnalysisCard({
  state,
  previewText,
  onOpen,
  onOpenHistory,
}: ProfileAnalysisCardProps) {
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { openPaywall } = usePaywallSheet();
  const { requiresPremium, enabled } = useFeatureAccess("premiumInsights");

  if (!enabled) {
    return null;
  }

  const locked = state === "locked" || requiresPremium;

  return (
    <View
      testID="profile-analysis-card"
      style={[
        styles.card,
        {
          gap: theme.spacing.sm * scaleSpace,
          padding: theme.spacing.lg * scaleSpace,
          borderRadius: theme.radii.lg,
          backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.7 : 1),
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.kicker,
          { color: theme.colors.accent, fontSize: 11 * scaleFont },
        ]}
      >
        PREMIUM
      </Text>
      <Text
        style={[
          styles.title,
          { color: theme.colors.heading, fontSize: 20 * scaleFont },
        ]}
      >
        {t("profileCard.title")}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
        ]}
      >
        {t("profileCard.subtitle")}
      </Text>

      {state === "loading" ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 * scaleFont }}>
          …
        </Text>
      ) : locked ? (
        <Pressable
          accessibilityRole="button"
          testID="profile-analysis-paywall"
          onPress={() => {
            void HapticsService.medium();
            openPaywall("content");
          }}
          style={({ pressed }) => [
            styles.cta,
            {
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.accent,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
            {t("profileCard.upgrade")}
          </Text>
        </Pressable>
      ) : state === "empty" ? (
        <Text
          style={[
            styles.preview,
            { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
          ]}
        >
          {t("profileCard.empty")}
        </Text>
      ) : (
        <>
          <Text
            numberOfLines={3}
            style={[
              styles.preview,
              { color: theme.colors.text, fontSize: 15 * scaleFont },
            ]}
          >
            {previewText}
          </Text>
          <View style={[styles.actions, { gap: theme.spacing.sm * scaleSpace }]}>
            <Pressable
              accessibilityRole="button"
              testID="profile-analysis-open"
              onPress={() => {
                void HapticsService.medium();
                onOpen?.();
              }}
              style={({ pressed }) => [
                styles.cta,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colors.canvas }]}>
                {t("profileCard.cta")}
              </Text>
            </Pressable>
            {onOpenHistory ? (
              <Pressable
                accessibilityRole="button"
                testID="profile-analysis-history"
                onPress={() => {
                  void HapticsService.light();
                  onOpenHistory();
                }}
              >
                <Text
                  style={[
                    styles.link,
                    { color: theme.colors.accent, fontSize: 13 * scaleFont },
                  ]}
                >
                  {t("historyTitle")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  preview: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  actions: {
    marginTop: 4,
  },
  cta: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  link: {
    fontFamily: fontFamilies.bodyMedium,
  },
});
