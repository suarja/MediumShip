import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { ResumeCard } from "../../src/components/library/resume-card";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function HistoryScreen() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const goBack = useGoBack("/profile");
  const insets = useSafeAreaInsets();

  return (
    <Screen>
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
          accessibilityLabel={t("library:historyScreen.back")}
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
            { color: theme.colors.heading, fontSize: 18 * scaleFont },
          ]}
          numberOfLines={1}
        >
          {t("library:historyScreen.title")}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xxl * scaleSpace,
            ...(isTablet
              ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const }
              : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResumeCard />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarAction: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActionGlyph: {
    fontFamily: fontFamilies.body,
    lineHeight: 28,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  content: {
    paddingTop: 4,
    gap: 16,
  },
});
