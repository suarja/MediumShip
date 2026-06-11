import { useGoBack } from "../../src/features/navigation/app-navigation";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { ScreenHeader } from "../../src/components/navigation/screen-header";
import { SavedLibrarySection } from "../../src/components/library/saved-library-section";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function FavoritesScreen() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleSpace } = useResponsive();
  const goBack = useGoBack("/library");
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <ScreenHeader
        title={t("library:favoritesScreen.title")}
        backLabel={t("library:favoritesScreen.back")}
        onBack={goBack}
      />

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
        <SavedLibrarySection mode="full" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 4,
  },
});
