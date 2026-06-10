import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  KIND_GLYPH,
  kindAccent,
} from "../../features/content/card-presentation";
import type { ContentKind } from "../../features/content/types";
import { HapticsService } from "../../features/haptics/haptics";
import { usePushWithReturn } from "../../features/navigation/app-navigation";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useFeatureAccess } from "../../features/tenant/use-feature-access";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import type { Id } from "../../../convex/_generated/dataModel";

export type AnalysisRelatedItem = {
  _id: Id<"contents">;
  kind: ContentKind;
  title: string;
  summary: string;
  category: string;
};

export type AnalysisViewData = {
  tasteText: string;
  related: AnalysisRelatedItem[];
};

type AnalysisViewProps = {
  state: "loading" | "locked" | "ready" | "empty";
  analysis?: AnalysisViewData | null;
};

export function AnalysisView({ state, analysis }: AnalysisViewProps) {
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const { openPaywall } = usePaywallSheet();
  const { requiresPremium } = useFeatureAccess("premiumInsights");

  if (state === "loading") {
    return (
      <View style={styles.center} testID="analysis-view-loading">
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={[styles.muted, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
          {t("detail.loading")}
        </Text>
      </View>
    );
  }

  if (state === "locked" || requiresPremium) {
    return (
      <View style={styles.center} testID="analysis-view-locked">
        <Text style={[styles.title, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
          {t("profileCard.title")}
        </Text>
        <Text style={[styles.muted, { color: theme.colors.textMuted, fontSize: 15 * scaleFont }]}>
          {t("profileCard.locked")}
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="analysis-view-paywall"
          onPress={() => openPaywall("content")}
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
      </View>
    );
  }

  if (state === "empty" || !analysis) {
    return (
      <View style={styles.center} testID="analysis-view-empty">
        <Text style={[styles.muted, { color: theme.colors.textMuted, fontSize: 15 * scaleFont }]}>
          {t("detail.empty")}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          gap: theme.spacing.lg * scaleSpace,
          maxWidth: isTablet ? 720 : undefined,
          alignSelf: isTablet ? "center" : undefined,
          width: isTablet ? "100%" : undefined,
        },
      ]}
      testID="analysis-view-ready"
    >
      <Text
        style={[
          styles.prose,
          {
            color: theme.colors.text,
            fontSize: 17 * scaleFont,
            lineHeight: 26 * scaleFont,
          },
        ]}
      >
        {analysis.tasteText}
      </Text>

      {analysis.related.length > 0 ? (
        <View style={{ gap: theme.spacing.sm * scaleSpace }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.heading,
                fontSize: 13 * scaleFont,
              },
            ]}
          >
            {t("detail.relatedTitle")}
          </Text>

          {analysis.related.map((item) => (
            <AnalysisRelatedRow key={item._id} item={item} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AnalysisRelatedRow({ item }: { item: AnalysisRelatedItem }) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const pushWithReturn = usePushWithReturn();
  const kAccent = kindAccent(item.kind, theme);

  return (
    <Pressable
      accessibilityRole="button"
      testID={`analysis-related-${item._id}`}
      onPress={() => {
        void HapticsService.light();
        pushWithReturn(`/${item.kind}/${item._id}`);
      }}
      style={({ pressed }) => [
        styles.relatedRow,
        {
          gap: theme.spacing.sm * scaleSpace,
          padding: theme.spacing.md * scaleSpace,
          borderRadius: theme.radii.md,
          backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.55 : 1),
          borderColor: theme.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.glyphTile,
          {
            backgroundColor: kAccent.accentSoft,
            borderRadius: theme.radii.sm,
          },
        ]}
      >
        <Text style={{ color: kAccent.accent, fontSize: 14 * scaleFont }}>
          {KIND_GLYPH[item.kind]}
        </Text>
      </View>
      <View style={styles.relatedCopy}>
        <Text
          numberOfLines={1}
          style={[
            styles.relatedKicker,
            { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
          ]}
        >
          {item.category}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.relatedTitle,
            { color: theme.colors.heading, fontSize: 15 * scaleFont },
          ]}
        >
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: fontFamilies.display,
    textAlign: "center",
  },
  muted: {
    fontFamily: fontFamilies.body,
    textAlign: "center",
    lineHeight: 22,
  },
  prose: {
    fontFamily: fontFamilies.body,
  },
  sectionTitle: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
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
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  glyphTile: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedCopy: {
    flex: 1,
    gap: 2,
  },
  relatedKicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  relatedTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    lineHeight: 20,
  },
});
