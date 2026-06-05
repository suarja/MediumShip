import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MemberGateCard } from "../../src/components/auth/member-gate-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const SECTION_KEYS = ["resume", "saved", "lists", "offline"] as const;

export default function LibraryScreen() {
  const { t } = useTranslation(["library", "common"]);
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

  if (!isLoaded) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text
            style={[
              styles.loadingLabel,
              {
                color: theme.colors.textMuted,
                fontSize: 14 * scaleFont,
              },
            ]}
          >
            {t("common:status.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.lg * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 30 * scaleFont,
              },
            ]}
          >
            {t("library:screen.title")}
          </Text>
        </View>

        {!isSignedIn ? (
          <View style={[styles.guestStack, { gap: theme.spacing.md * scaleSpace }]}>
            <MemberGateCard
              ctaLabel={t("library:actions.signInCta")}
              description={t("library:screen.guestBody")}
              title={t("library:screen.guestTitle")}
            />

            <View
              style={[
                styles.guestNote,
                {
                  borderRadius: theme.radii.xl,
                  borderColor: theme.colors.border,
                  backgroundColor: withAlpha(
                    theme.colors.accent,
                    theme.isDark ? 0.14 : 0.06,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.guestNoteTitle,
                  {
                    color: theme.colors.heading,
                    fontSize: 16 * scaleFont,
                  },
                ]}
              >
                {t("library:saved.guestTitle")}
              </Text>
              <Text
                style={[
                  styles.guestNoteBody,
                  {
                    color: theme.colors.textMuted,
                    fontSize: 14 * scaleFont,
                  },
                ]}
              >
                {t("library:saved.guestHint")}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.introCard,
                {
                  borderRadius: theme.radii.xl,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  gap: theme.spacing.sm * scaleSpace,
                },
              ]}
            >
              <Text
                style={[
                  styles.introTitle,
                  {
                    color: theme.colors.heading,
                    fontSize: 20 * scaleFont,
                  },
                ]}
              >
                {t("library:screen.signedInTitle")}
              </Text>
              <Text
                style={[
                  styles.introBody,
                  {
                    color: theme.colors.textMuted,
                    fontSize: 15 * scaleFont,
                  },
                ]}
              >
                {t("library:screen.signedInBody")}
              </Text>
            </View>

            <View style={[styles.sectionList, { gap: theme.spacing.md * scaleSpace }]}>
              {SECTION_KEYS.map((key) => (
                <View
                  key={key}
                  style={[
                    styles.sectionCard,
                    {
                      borderRadius: theme.radii.xl,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.colors.heading,
                        fontSize: 16 * scaleFont,
                      },
                    ]}
                  >
                    {t(`library:screen.sections.${key}`)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.5,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    fontFamily: fontFamilies.body,
  },
  guestStack: {},
  guestNote: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 18,
  },
  guestNoteTitle: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.2,
  },
  guestNoteBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 21,
  },
  introCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  introTitle: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
  },
  introBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  sectionList: {},
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
  },
});
