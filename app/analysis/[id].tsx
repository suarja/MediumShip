import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AnalysisView } from "../../src/components/insights/analysis-view";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useAnalysisById } from "../../src/features/insights/use-analysis";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useFeatureAccess } from "../../src/features/tenant/use-feature-access";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { Id } from "../../convex/_generated/dataModel";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
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
        <View
          style={[
            styles.topBar,
            {
              marginHorizontal: -(theme.spacing.lg * scaleSpace),
              paddingHorizontal: theme.spacing.lg * scaleSpace,
            },
          ]}
        >
          <Pressable
            onPress={goBack}
            style={styles.topBarAction}
            accessibilityRole="button"
            accessibilityLabel={t("detail.back")}
          >
            <Text
              style={[
                styles.topBarActionGlyph,
                { color: theme.colors.heading, fontSize: 24 * scaleFont },
              ]}
            >
              ‹
            </Text>
          </Pressable>
          <Text
            style={[
              styles.topBarTitle,
              { color: theme.colors.heading, fontSize: 17 * scaleFont },
            ]}
          >
            {t("title")}
          </Text>
          <View style={styles.topBarAction} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: tabBarSpace + theme.spacing.xl * scaleSpace,
            gap: theme.spacing.md * scaleSpace,
          }}
          showsVerticalScrollIndicator={false}
        >
          <AnalysisView
            state={viewState}
            analysis={
              analysis
                ? {
                    tasteText: analysis.tasteText,
                    reflection: analysis.reflection,
                    trends: analysis.trends,
                    dayKey: analysis.dayKey,
                    related: analysis.related,
                  }
                : null
            }
          />
        </ScrollView>
      </FeatureAccessGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  topBarAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActionGlyph: {
    fontFamily: fontFamilies.body,
    lineHeight: 28,
  },
  topBarTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
});
