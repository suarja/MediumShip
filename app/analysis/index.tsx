import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnalysisHistoryRow } from "../../src/components/insights/analysis-history-row";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useAnalysisHistory } from "../../src/features/insights/use-analysis";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { Id } from "../../convex/_generated/dataModel";

export default function AnalysisHistoryScreen() {
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack("/profile");
  const { isSignedIn } = useClerkAuth();
  const { analyses, isLoading } = useAnalysisHistory();

  if (!isSignedIn) {
    router.replace("/profile");
    return null;
  }

  const handleOpen = (id: Id<"tasteAnalysis">) => {
    router.push(`/analysis/${id}`);
  };

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
              maxWidth: isTablet ? 720 : undefined,
              alignSelf: isTablet ? "center" : undefined,
              width: isTablet ? "100%" : undefined,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
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
              { color: theme.colors.heading, fontSize: 28 * scaleFont },
            ]}
          >
            {t("historyTitle")}
          </Text>

          {isLoading ? (
            <Text style={{ color: theme.colors.textMuted }}>…</Text>
          ) : analyses.length === 0 ? (
            <View testID="analysis-history-empty" style={styles.empty}>
              <Text
                style={[
                  styles.emptyLabel,
                  { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
                ]}
              >
                {t("history.empty")}
              </Text>
            </View>
          ) : (
            analyses.map((item, index) => (
              <AnalysisHistoryRow
                key={item._id}
                item={item}
                divider={index > 0}
                onPress={handleOpen}
              />
            ))
          )}
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
  empty: {
    paddingTop: 24,
  },
  emptyLabel: {
    fontFamily: fontFamilies.body,
    textAlign: "center",
  },
});
