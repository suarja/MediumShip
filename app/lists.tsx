import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../src/components/layout/screen";
import { LibraryPersonalListRow } from "../src/components/library/library-personal-list-row";
import { useIsMember } from "../src/features/membership/use-is-member";
import { usePaywallSheet } from "../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../src/features/responsive/use-responsive";
import { withAlpha } from "../src/features/theme/contrast";
import { fontFamilies } from "../src/features/theme/fonts";
import { useAppTheme } from "../src/features/theme/theme-provider";

export default function ListsScreen() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();

  const showPendingAction = (title: string) => {
    Alert.alert(title, t("listsScreen.pendingAction"));
  };

  const handleCreateList = () => {
    if (!isMember) {
      openPaywall("lists");
      return;
    }
    showPendingAction(t("listsScreen.createTitle"));
  };

  const handleOpenList = (title: string) => {
    if (!isMember) {
      openPaywall("lists");
      return;
    }
    showPendingAction(title);
  };

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
          onPress={() => router.back()}
          style={styles.topBarAction}
          accessibilityRole="button"
          accessibilityLabel={t("listsScreen.back")}
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
          {t("screen.sections.lists")}
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
        <View style={[styles.stack, { gap: theme.spacing.sm * scaleSpace }]}>
          <Pressable
            accessibilityRole="button"
            onPress={handleCreateList}
            style={({ pressed }) => [
              styles.createRow,
              {
                gap: 11 * scaleSpace,
                borderRadius: theme.radii.md,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 11 * scaleSpace,
                paddingVertical: 9 * scaleSpace,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.createIcon,
                {
                  borderRadius: theme.radii.sm,
                  backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12),
                },
              ]}
            >
              <Text
                style={[
                  styles.createIconLabel,
                  { color: theme.colors.accent, fontSize: 18 * scaleFont },
                ]}
              >
                +
              </Text>
            </View>
            <Text
              style={[
                styles.createTitle,
                { color: theme.colors.heading, fontSize: 14 * scaleFont },
              ]}
            >
              {t("listsScreen.createTitle")}
            </Text>
          </Pressable>

          <LibraryPersonalListRow
            onPress={() => handleOpenList(t("screen.listsPreviewTitle"))}
          />

          {isMember ? (
            <LibraryPersonalListRow
              onPress={() => handleOpenList(t("listsScreen.secondPreviewTitle"))}
              title={t("listsScreen.secondPreviewTitle")}
              meta={t("listsScreen.secondPreviewMeta")}
            />
          ) : (
            <View
              style={[
                styles.lockedCard,
                {
                  gap: theme.spacing.sm * scaleSpace,
                  borderRadius: theme.radii.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md * scaleSpace,
                },
              ]}
            >
              <Text
                style={[
                  styles.lockedTitle,
                  { color: theme.colors.heading, fontSize: 14 * scaleFont },
                ]}
              >
                {t("listsScreen.lockedTitle")}
              </Text>
              <Text
                style={[
                  styles.lockedBody,
                  { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
                ]}
              >
                {t("listsScreen.lockedBody")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => openPaywall("lists")}
                style={({ pressed }) => [
                  styles.premiumButton,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.premium,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.premiumButtonLabel,
                    {
                      color: theme.colors.accentContrast,
                      fontSize: 12 * scaleFont,
                    },
                  ]}
                >
                  {t("listsScreen.viewPremiumCta")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
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
  },
  stack: {},
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  createIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  createIconLabel: {
    fontFamily: fontFamilies.display,
    lineHeight: 22,
  },
  createTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  lockedCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  lockedTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  lockedBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
  premiumButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  premiumButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.88,
  },
});
