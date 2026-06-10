import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FeedRow } from "../content/feed-row";
import { cardKicker, cardMeta } from "../../features/content/card-presentation";
import type { ContentCardModel, ContentKind } from "../../features/content/types";
import { getContentCoverImageUrl } from "../../features/content/selectors";
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
  isPremium: boolean;
  heroImageUrl?: string;
  readingTimeMinutes?: number;
  durationSeconds?: number;
  rationale?: string;
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

  const metaParts: string[] = [];
  if (item.readingTimeMinutes) {
    metaParts.push(`${item.readingTimeMinutes} min read`);
  }
  if (durationMinutes) {
    metaParts.push(`${durationMinutes} min`);
  }
  if (item.isPremium) {
    metaParts.push("Premium");
  }

  return {
    id: item._id,
    kind: item.kind,
    kindLabel: item.kind,
    category: item.category,
    title: item.title,
    summary: item.summary,
    metaLabel: metaParts.join(" · "),
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

function ReportSection({
  kicker,
  body,
  testID,
}: {
  kicker: string;
  body: string;
  testID?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <View
      testID={testID}
      style={[
        styles.section,
        {
          gap: theme.spacing.sm * scaleSpace,
          paddingVertical: theme.spacing.md * scaleSpace,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionKicker,
          { color: theme.colors.accent, fontSize: 11 * scaleFont },
        ]}
      >
        {kicker}
      </Text>
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
        {body}
      </Text>
    </View>
  );
}

export function AnalysisView({ state, analysis }: AnalysisViewProps) {
  const { t } = useTranslation(["insights", "home"]);
  const { theme } = useAppTheme();
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
          {t("insights:detail.loading")}
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
          {t("insights:profileCard.title")}
        </Text>
        <Text
          style={[
            styles.muted,
            { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
          ]}
        >
          {t("insights:profileCard.locked")}
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
            {t("insights:profileCard.upgrade")}
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
          {t("insights:detail.empty")}
        </Text>
      </View>
    );
  }

  const hasNarrative =
    analysis.tasteText.trim().length > 0 ||
    Boolean(analysis.reflection?.trim()) ||
    Boolean(analysis.trends?.trim());

  return (
    <View style={styles.container} testID="analysis-view-ready">
      {analysis.dayKey ? (
        <Text
          style={[
            styles.dateLabel,
            { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
          ]}
        >
          {t("insights:detail.dateLabel", { day: analysis.dayKey })}
        </Text>
      ) : null}

      {!hasNarrative ? (
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
          {t("insights:detail.missingBody")}
        </Text>
      ) : null}

      {analysis.tasteText.trim().length > 0 ? (
        <ReportSection
          testID="analysis-section-overview"
          kicker={t("insights:detail.overviewKicker")}
          body={analysis.tasteText}
        />
      ) : null}

      {analysis.reflection?.trim() ? (
        <ReportSection
          testID="analysis-section-reflection"
          kicker={t("insights:detail.reflectionKicker")}
          body={analysis.reflection}
        />
      ) : null}

      {analysis.trends?.trim() ? (
        <ReportSection
          testID="analysis-section-trends"
          kicker={t("insights:detail.trendsKicker")}
          body={analysis.trends}
        />
      ) : null}

      {analysis.related.length > 0 ? (
        <View
          style={[
            styles.picksBlock,
            {
              gap: theme.spacing.lg * scaleSpace,
              marginTop: theme.spacing.md * scaleSpace,
              paddingTop: theme.spacing.lg * scaleSpace,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={{ gap: theme.spacing.xs * scaleSpace }}>
            <Text
              style={[
                styles.sectionKicker,
                { color: theme.colors.accent, fontSize: 11 * scaleFont },
              ]}
            >
              {t("insights:detail.picksKicker")}
            </Text>
            <Text
              style={[
                styles.picksLead,
                {
                  color: theme.colors.heading,
                  fontSize: 22 * scaleFont,
                  lineHeight: 28 * scaleFont,
                },
              ]}
            >
              {t("insights:detail.relatedTitle")}
            </Text>
          </View>

          {analysis.related.map((item) => {
            const card = toCardModel(item);
            return (
              <View
                key={item._id}
                testID={`analysis-pick-${item._id}`}
                style={[
                  styles.pickCard,
                  {
                    gap: theme.spacing.md * scaleSpace,
                    padding: theme.spacing.md * scaleSpace,
                    borderRadius: theme.radii.lg,
                    backgroundColor: withAlpha(
                      theme.colors.surface,
                      theme.isDark ? 0.55 : 1,
                    ),
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {item.rationale?.trim() ? (
                  <Text
                    style={[
                      styles.rationale,
                      {
                        color: theme.colors.text,
                        fontSize: 15 * scaleFont,
                        lineHeight: 23 * scaleFont,
                      },
                    ]}
                  >
                    {item.rationale}
                  </Text>
                ) : null}

                <FeedRow
                  item={card}
                  kicker={cardKicker(card, (key) => t(`home:${key}`))}
                  meta={cardMeta(card, (key, opts) => t(`home:${key}`, opts))}
                  divider={false}
                  showOverflowActions
                />
              </View>
            );
          })}
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
  dateLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
  },
  sectionKicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionBody: {
    fontFamily: fontFamilies.body,
  },
  picksBlock: {
    width: "100%",
  },
  picksLead: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.3,
  },
  pickCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  rationale: {
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
