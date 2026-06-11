import { useGoBack } from "../../src/features/navigation/app-navigation";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { ScreenHeader } from "../../src/components/navigation/screen-header";
import { DownloadedLibrarySection } from "../../src/components/library/downloaded-library-section";
import { LibraryOfflineLockedCard } from "../../src/components/library/library-offline-locked-card";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function DownloadsScreen() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleSpace } = useResponsive();
  const goBack = useGoBack("/library");
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useClerkAuth();
  const { isMember } = useIsMember();
  const { openPaywall } = usePaywallSheet();

  return (
    <Screen>
      <ScreenHeader
        title={t("library:downloadsScreen.title")}
        backLabel={t("library:downloadsScreen.back")}
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
        {isSignedIn && isMember ? (
          <DownloadedLibrarySection mode="full" />
        ) : isSignedIn ? (
          <LibraryOfflineLockedCard onPress={() => openPaywall("offline")} />
        ) : (
          <DownloadedLibrarySection mode="full" />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 4,
  },
});
