import { useRouter } from "expo-router";

import { usePushWithReturn } from "../../src/features/navigation/app-navigation";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { DownloadedLibrarySection } from "../../src/components/library/downloaded-library-section";
import { LibraryBriefingLockedCard } from "../../src/components/library/library-briefing-locked-card";
import { LibraryBriefingRow } from "../../src/components/library/library-briefing-row";
import { LibraryOfflineLockedCard } from "../../src/components/library/library-offline-locked-card";
import { LibraryPersonalListRow } from "../../src/components/library/library-personal-list-row";
import { LibrarySectionHeader } from "../../src/components/library/library-section-header";
import { ResumeCard } from "../../src/components/library/resume-card";
import { useResume } from "../../src/features/history/use-resume";
import { SavedLibrarySection } from "../../src/components/library/saved-library-section";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { useAnalysisHistory } from "../../src/features/insights/use-analysis";
import { usePersonalLists } from "../../src/features/personal-lists/use-personal-lists";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { hasCapability } from "../../src/features/tenant/public-config";

import { HapticsService } from "../../src/features/haptics/haptics";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const SECTION_KEYS = ["resume", "saved", "lists", "offline"] as const;

export default function LibraryScreen() {
  const { t } = useTranslation("library");
  const { isSignedIn } = useClerkAuth();
  const router = useRouter();
  const { theme, enabledModules } = useAppTheme();
  const canBookmark = hasCapability(enabledModules, "bookmarks");
  const canPersonalLists = hasCapability(enabledModules, "personalLists");
  const canOffline = hasCapability(enabledModules, "offline");
  const canProgressSync = hasCapability(enabledModules, "progressSync");
  const { scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

  if (!isSignedIn) {
    return (
      <Screen>
        <View
          style={[
            styles.topBar,
            { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
          ]}
        >
          <View style={styles.topBarSide} />
          <Text
            style={[
              styles.topBarTitle,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
              },
            ]}
          >
            {t("library:screen.title")}
          </Text>
          <View style={styles.topBarSide} />
        </View>

        <View
          style={[
            styles.gateScreen,
            {
              paddingBottom: tabBarSpace + persistentPlayerSpace,
              paddingHorizontal: 32 * scaleSpace,
              paddingTop: 120 * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.crest,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.crestLabel,
                {
                  color: theme.colors.accentContrast,
                  fontSize: 30 * scaleFont,
                },
              ]}
            >
              M
            </Text>
          </View>

          <Text
            style={[
              styles.gateTitle,
              {
                color: theme.colors.heading,
                fontSize: 26 * scaleFont,
              },
            ]}
          >
            {t("library:screen.guestTitle")}
          </Text>
          <Text
            style={[
              styles.gateBody,
              {
                color: theme.colors.textMuted,
                fontSize: 13 * scaleFont,
              },
            ]}
          >
            {t("library:screen.guestBody")}
          </Text>

          <View
            style={[
              styles.gateActions,
              {
                gap: theme.spacing.sm * scaleSpace,
                marginTop: theme.spacing.xs * scaleSpace,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void HapticsService.medium();
                router.push("/sign-in");
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonLabel,
                  {
                    color: theme.colors.canvas,
                    fontSize: 15 * scaleFont,
                  },
                ]}
              >
                {t("library:actions.signInCta")}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void HapticsService.selection();
                router.replace("/home");
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: withAlpha(theme.colors.heading, theme.isDark ? 0.2 : 0.12),
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonLabel,
                  {
                    color: theme.colors.heading,
                    fontSize: 14 * scaleFont,
                  },
                ]}
              >
                {t("library:screen.guestContinueCta")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <SignedInLibraryContent
      canBookmark={canBookmark}
      canBriefing={hasCapability(enabledModules, "premiumInsights")}
      canOffline={canOffline}
      canPersonalLists={canPersonalLists}
      canProgressSync={canProgressSync}
      persistentPlayerSpace={persistentPlayerSpace}
      tabBarSpace={tabBarSpace}
    />
  );
}

type SignedInLibraryContentProps = {
  canBookmark: boolean;
  canBriefing: boolean;
  canPersonalLists: boolean;
  canOffline: boolean;
  canProgressSync: boolean;
  tabBarSpace: number;
  persistentPlayerSpace: number;
};

function SignedInLibraryContent({
  canBookmark,
  canBriefing,
  canPersonalLists,
  canOffline,
  canProgressSync,
  tabBarSpace,
  persistentPlayerSpace,
}: SignedInLibraryContentProps) {
  const { t } = useTranslation(["library", "insights", "profile"]);
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const router = useRouter();
  const pushWithReturn = usePushWithReturn();
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();
  const { primaryList } = usePersonalLists();
  const { analyses } = useAnalysisHistory();
  const { t: tLists } = useTranslation("lists");
  const latestBriefing = analyses[0];
  const briefingCount = analyses.length;

  const openBriefingHistory = () => {
    void HapticsService.light();
    pushWithReturn("/analysis");
  };

  const handleListsPress = () => {
    void HapticsService.light();
    pushWithReturn("/lists");
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              tabBarSpace + persistentPlayerSpace + theme.spacing.xxl * scaleSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.topBar,
            { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
          ]}
        >
          <View style={styles.topBarSide} />
          <Text
            style={[
              styles.topBarTitle,
              {
                color: theme.colors.heading,
                fontSize: 18 * scaleFont,
              },
            ]}
          >
            {t("library:screen.title")}
          </Text>
          <View style={styles.topBarSide} />
        </View>

        <View style={[styles.filters, { marginBottom: theme.spacing.xl * scaleSpace }]}>
          {(["all", "articles", "podcasts", "offline"] as const).map((key, index) => (
            <View
              key={key}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor:
                    index === 0 ? theme.colors.heading : withAlpha(theme.colors.heading, 0.12),
                  backgroundColor: index === 0 ? theme.colors.heading : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  {
                    color: index === 0 ? theme.colors.canvas : theme.colors.textMuted,
                    fontSize: 10 * scaleFont,
                  },
                ]}
              >
                {t(`library:screen.filters.${key}`)}
              </Text>
            </View>
          ))}
        </View>

        <ResumeSection canProgressSync={canProgressSync} />

        {canBookmark ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              onSeeAllPress={() => {
                void HapticsService.light();
                pushWithReturn("/favorites");
              }}
              seeAllLabel={t("library:screen.seeAll")}
              title={t("library:screen.sections.saved")}
            />
            <SavedLibrarySection />
          </View>
        ) : null}

        {canPersonalLists ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              gate="premium"
              title={t("library:screen.sections.lists")}
            />
            <LibraryPersonalListRow
              onPress={handleListsPress}
              title={primaryList?.title ?? t("library:screen.listsPreviewTitle")}
              meta={
                primaryList
                  ? tLists("screen.itemCount", { count: primaryList.itemCount })
                  : t("library:screen.listsPreviewMeta")
              }
              accessibilityLabel={
                primaryList?.title ?? t("library:screen.listsPreviewTitle")
              }
              previewCoverUrls={primaryList?.previewCoverUrls}
              itemCount={primaryList?.itemCount ?? 0}
            />
          </View>
        ) : null}

        {canBriefing ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              gate="premium"
              onSeeAllPress={
                isMember && briefingCount > 0 ? openBriefingHistory : undefined
              }
              seeAllLabel={
                isMember && briefingCount > 0 ? t("library:screen.seeAll") : undefined
              }
              title={t("library:screen.sections.briefing")}
            />
            {isMember ? (
              <LibraryBriefingRow
                onPress={openBriefingHistory}
                title={
                  latestBriefing
                    ? t("insights:detail.dateLabel", { day: latestBriefing.dayKey })
                    : t("library:screen.briefingPreviewTitle")
                }
                meta={
                  briefingCount > 0
                    ? t("profile:rows.briefing.subMember", { count: briefingCount })
                    : t("library:screen.briefingPreviewMeta")
                }
                accessibilityLabel={t("library:screen.sections.briefing")}
              />
            ) : (
              <LibraryBriefingLockedCard onPress={() => openPaywall("content")} />
            )}
          </View>
        ) : null}

        {canOffline ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              gate="premium"
              onSeeAllPress={() => {
                void HapticsService.light();
                pushWithReturn("/downloads");
              }}
              seeAllLabel={t("library:screen.seeAll")}
              title={t("library:screen.sections.offline")}
            />
            {isMember ? (
              <DownloadedLibrarySection />
            ) : (
              <LibraryOfflineLockedCard onPress={() => openPaywall("offline")} />
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ResumeSection({ canProgressSync }: { canProgressSync: boolean }) {
  const { t } = useTranslation("library");
  const { data: resume, isLoading } = useResume({ enabled: canProgressSync });

  if (!canProgressSync || (!isLoading && !resume)) {
    return null;
  }

  return (
    <View style={styles.sectionBlockFirst}>
      <LibrarySectionHeader title={t("library:screen.sections.resume")} />
      <ResumeCard enabled={canProgressSync} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarSide: {
    width: 34,
    height: 34,
  },
  topBarTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  gateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  crest: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  crestLabel: {
    fontFamily: fontFamilies.displayItalic,
  },
  gateTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.4,
    lineHeight: 30,
    textAlign: "center",
  },
  gateBody: {
    maxWidth: 280,
    fontFamily: fontFamilies.body,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  gateActions: {
    width: "100%",
    maxWidth: 280,
  },
  primaryButton: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonLabel: {
    fontFamily: fontFamilies.bodyMedium,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterChipLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionBlockFirst: {
    marginTop: 8,
  },
  sectionBlock: {
    marginTop: 20,
  },
});
