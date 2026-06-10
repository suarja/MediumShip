import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnalysisPickCard } from "./analysis-pick-card";
import type { ContentCardModel, ContentKind } from "../../features/content/types";
import { getContentCoverImageUrl } from "../../features/content/selectors";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useFeatureAccess } from "../../features/tenant/use-feature-access";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import type { Id } from "../../../convex/_generated/dataModel";

export type AnalysisRelatedItem = {
  _id: Id<"contents">;
  kind: ContentKind;
  title: string;
  summary: string;
  category: string;
  isPremium: boolean;
  heroImageUrl?: string;
  readingTimeMinutes?: number;
  durationSeconds?: number;
  rationale?: string;
  isLiked: boolean;
};

export type AnalysisViewData = {
  tasteText: string;
  reflection?: string;
  trends?: string;
  dayKey?: string;
  related: AnalysisRelatedItem[];
};

type AnalysisViewProps = {
  state: "loading" | "locked" | "ready" | "empty";
  analysis?: AnalysisViewData | null;
};

function toCardModel(item: AnalysisRelatedItem): ContentCardModel {
  const durationMinutes =
    (item.kind === "episode" || item.kind === "video") && item.durationSeconds
      ? Math.round(item.durationSeconds / 60)
      : undefined;

  return {
    id: item._id,
    kind: item.kind,
    kindLabel: item.kind,
    category: item.category,
    title: item.title,
    summary: item.summary,
    metaLabel: "",
    readingTimeMinutes: item.readingTimeMinutes,
    durationMinutes,
    href: `/${item.kind}/${item._id}`,
    isPremium: item.isPremium,
    coverImageUrl: getContentCoverImageUrl({
      _id: item._id,
      kind: item.kind,
      heroImageUrl: item.heroImageUrl,
    } as never),
  };
}

/** Single overview block — legacy reflection/trends are not shown as sections. */
function briefingOverviewBody(analysis: AnalysisViewData): string {
  return analysis.tasteText.trim();
}

export function AnalysisView({ state, analysis }: AnalysisViewProps) {
  const { t } = useTranslation("insights");
  const { theme, tenantSlug } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { openPaywall } = usePaywallSheet();
  const { requiresPremium } = useFeatureAccess("premiumInsights");

  if (state === "loading") {
    return (
      <View style={styles.center} testID="analysis-view-loading">
        <ActivityIndicator color={theme.colors.accent} />
        <Text
          style={[
            styles.muted,
            { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
          ]}
        >
          {t("detail.loading")}
        </Text>
      </View>
    );
  }

  if (state === "locked" || requiresPremium) {
    return (
      <View style={styles.center} testID="analysis-view-locked">
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontSize: 22 * scaleFont },
          ]}
        >
          {t("profileCard.title")}
        </Text>
        <Text
          style={[
            styles.muted,
            { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
          ]}
        >
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
        <Text
          style={[
            styles.muted,
            { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
          ]}
        >
          {t("detail.empty")}
        </Text>
      </View>
    );
  }

  const overviewBody = briefingOverviewBody(analysis);
  const hasOverview = overviewBody.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: theme.spacing.md * scaleSpace,
          gap: theme.spacing.xl * scaleSpace,
        },
      ]}
      testID="analysis-view-ready"
    >
      {!hasOverview ? (
        <Text
          style={[
            styles.muted,
            {
              color: theme.colors.textMuted,
              fontSize: 15 * scaleFont,
              textAlign: "left",
            },
          ]}
        >
          {t("detail.missingBody")}
        </Text>
      ) : (
        <View
          testID="analysis-section-overview"
          style={{ gap: theme.spacing.sm * scaleSpace }}
        >
          {analysis.dayKey ? (
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.heading,
                  fontSize: 22 * scaleFont,
                  lineHeight: 28 * scaleFont,
                },
              ]}
            >
              {t("detail.dateLabel", { day: analysis.dayKey })}
            </Text>
          ) : null}
          <Text
            style={[
              styles.sectionBody,
              {
                color: theme.colors.text,
                fontSize: 17 * scaleFont,
                lineHeight: 27 * scaleFont,
              },
            ]}
          >
            {overviewBody}
          </Text>
        </View>
      )}

      {analysis.related.length > 0 ? (
        <View style={{ gap: theme.spacing.md * scaleSpace }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.heading,
                fontSize: 22 * scaleFont,
                lineHeight: 28 * scaleFont,
              },
            ]}
          >
            {t("detail.relatedTitle")}
          </Text>

          <View style={{ gap: theme.spacing.lg * scaleSpace }}>
            {analysis.related.map((item) => (
              <AnalysisPickCard
                key={item._id}
                item={toCardModel(item)}
                rationale={item.rationale}
                isLiked={item.isLiked}
                tenantSlug={tenantSlug}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
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
    paddingVertical: 24,
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
  sectionTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.3,
  },
  sectionBody: {
    fontFamily: fontFamilies.body,
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
