import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { ScreenHeader } from "../../src/components/navigation/screen-header";
import { HistoryRow } from "../../src/components/history/history-row";
import { ResumeCard } from "../../src/components/library/resume-card";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useReadingHistory } from "../../src/features/history/use-reading-history";
import { useProgressSyncEnabled } from "../../src/features/history/use-progress-sync-enabled";
import { useGoBack } from "../../src/features/navigation/app-navigation";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function HistoryScreen() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const goBack = useGoBack("/profile");
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useClerkAuth();
  const { enabled, isLoading: isGateLoading } = useProgressSyncEnabled();
  const { data: history, isLoading, clearReadingHistory } = useReadingHistory();

  const handleClear = () => {
    Alert.alert(
      t("library:historyScreen.clearConfirmTitle"),
      t("library:historyScreen.clearConfirmBody"),
      [
        { text: t("library:historyScreen.cancel"), style: "cancel" },
        {
          text: t("library:historyScreen.clearConfirmCta"),
          style: "destructive",
          onPress: () => {
            void clearReadingHistory({});
          },
        },
      ],
    );
  };

  const showGate = !isSignedIn || !enabled;
  const showEmpty = enabled && !isLoading && history.length === 0;

  return (
    <Screen>
      <ScreenHeader
        title={t("library:historyScreen.title")}
        backLabel={t("library:historyScreen.back")}
        onBack={goBack}
        right={
          enabled && history.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("library:historyScreen.clear")}
              onPress={handleClear}
              style={styles.clearAction}
            >
              <Text
                style={[
                  styles.clearLabel,
                  {
                    color: theme.colors.accent,
                    fontSize: 12 * scaleFont,
                  },
                ]}
              >
                {t("library:historyScreen.clear")}
              </Text>
            </Pressable>
          ) : null
        }
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
        {showGate ? (
          <View
            style={[
              styles.gateCard,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: withAlpha(theme.colors.heading, 0.04),
              },
            ]}
          >
            <Text
              style={[
                styles.gateTitle,
                { color: theme.colors.heading, fontSize: 16 * scaleFont },
              ]}
            >
              {t("library:historyScreen.guestTitle")}
            </Text>
            <Text
              style={[
                styles.gateBody,
                { color: theme.colors.textMuted, fontSize: 13 * scaleFont },
              ]}
            >
              {t("library:historyScreen.guestBody")}
            </Text>
          </View>
        ) : (
          <>
            <ResumeCard enabled={enabled} />

            {isGateLoading || isLoading ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : null}

            {showEmpty ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    borderRadius: theme.radii.lg,
                    backgroundColor: withAlpha(theme.colors.heading, 0.04),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
                  ]}
                >
                  {t("library:historyScreen.empty")}
                </Text>
              </View>
            ) : null}

            {history.map((item, index) => (
              <HistoryRow
                key={item.contentId}
                divider={index > 0 || Boolean(!isLoading)}
                item={item}
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clearAction: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  clearLabel: {
    fontFamily: fontFamilies.bodyMedium,
  },
  content: {
    paddingTop: 4,
    gap: 16,
  },
  gateCard: {
    padding: 20,
    gap: 8,
  },
  gateTitle: {
    fontFamily: fontFamilies.display,
  },
  gateBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  emptyCard: {
    padding: 20,
  },
  emptyText: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
    textAlign: "center",
  },
});
