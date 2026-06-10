import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnalysisView } from "../../src/components/insights/analysis-view";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useAnalysisById } from "../../src/features/insights/use-analysis";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useFeatureAccess } from "../../src/features/tenant/use-feature-access";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { Id } from "../../convex/_generated/dataModel";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack("/profile");
  const { isSignedIn } = useClerkAuth();
  const { requiresPremium, isLoading: isGateLoading } = useFeatureAccess("premiumInsights");
  const analysisId = id ? (id as Id<"tasteAnalysis">) : null;
  const { analysis, isLoading, canAccess } = useAnalysisById(analysisId);

  if (!isSignedIn) {
    router.replace("/profile");
    return null;
  }

  const viewState = (() => {
    if (isGateLoading || isLoading) {
      return "loading" as const;
    }
    if (!canAccess || requiresPremium) {
      return "locked" as const;
    }
    if (!analysis) {
      return "empty" as const;
    }
    return "ready" as const;
  })();

  return (
    <Screen>
      <FeatureAccessGate featureKey="premiumInsights">
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + theme.spacing.md * scaleSpace,
              paddingBottom: insets.bottom + theme.spacing.xl * scaleSpace,
              paddingHorizontal: theme.spacing.lg * scaleSpace,
            },
          ]}
        >
          <Text
            accessibilityRole="button"
            onPress={goBack}
            style={[
              styles.back,
              { color: theme.colors.accent, fontSize: 13 * scaleFont },
            ]}
          >
            ←
          </Text>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 28 * scaleFont,
                maxWidth: isTablet ? 720 : undefined,
              },
            ]}
          >
            {t("title")}
          </Text>

          <AnalysisView
            state={viewState}
            analysis={
              analysis
                ? { tasteText: analysis.tasteText, related: analysis.related }
                : null
            }
          />
        </ScrollView>
      </FeatureAccessGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  back: {
    fontFamily: fontFamilies.mono,
    alignSelf: "flex-start",
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
  },
});
