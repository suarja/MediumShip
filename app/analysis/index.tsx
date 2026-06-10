import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AnalysisHistoryRow } from "../../src/components/insights/analysis-history-row";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useAnalysisHistory } from "../../src/features/insights/use-analysis";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import type { Id } from "../../convex/_generated/dataModel";

export default function AnalysisHistoryScreen() {
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
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
            {t("historyTitle")}
          </Text>
          <View style={styles.topBarAction} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: tabBarSpace + theme.spacing.xl * scaleSpace,
            gap: theme.spacing.sm * scaleSpace,
          }}
          showsVerticalScrollIndicator={false}
        >
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
  empty: {
    paddingTop: 24,
  },
  emptyLabel: {
    fontFamily: fontFamilies.body,
    textAlign: "center",
  },
});
