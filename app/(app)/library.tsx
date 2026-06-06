import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { DownloadedLibrarySection } from "../../src/components/library/downloaded-library-section";
import { LibraryOfflineLockedCard } from "../../src/components/library/library-offline-locked-card";
import { LibraryPersonalListRow } from "../../src/components/library/library-personal-list-row";
import { LibrarySectionHeader } from "../../src/components/library/library-section-header";
import { ResumeCard } from "../../src/components/library/resume-card";
import { SavedLibrarySection } from "../../src/components/library/saved-library-section";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { hasCapability } from "../../src/features/tenant/public-config";

/** Mockup-aligned loupe scale for the top-bar action (matches Explore search card). */
const SEARCH_GLYPH_SIZE = 19;
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
              onPress={() => router.push("/sign-in")}
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
              onPress={() => router.replace("/home")}
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
      canOffline={canOffline}
      canPersonalLists={canPersonalLists}
      persistentPlayerSpace={persistentPlayerSpace}
      tabBarSpace={tabBarSpace}
    />
  );
}

type SignedInLibraryContentProps = {
  canBookmark: boolean;
  canPersonalLists: boolean;
  canOffline: boolean;
  tabBarSpace: number;
  persistentPlayerSpace: number;
};

function SignedInLibraryContent({
  canBookmark,
  canPersonalLists,
  canOffline,
  tabBarSpace,
  persistentPlayerSpace,
}: SignedInLibraryContentProps) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const router = useRouter();
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();

  const handleListsPress = () => {
    if (isMember) {
      router.push("/lists");
      return;
    }
    openPaywall("lists");
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
          <View
            style={[
              styles.topBarAction,
              { width: 34 * scaleSpace, height: 34 * scaleSpace },
            ]}
          >
            <Text
              testID="library-top-bar-search"
              style={[
                styles.topBarActionGlyph,
                {
                  color: theme.colors.heading,
                  fontSize: SEARCH_GLYPH_SIZE * scaleFont,
                  lineHeight: SEARCH_GLYPH_SIZE * scaleFont,
                },
              ]}
            >
              ⌕
            </Text>
          </View>
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

        <View style={styles.sectionBlockFirst}>
          <LibrarySectionHeader title={t("library:screen.sections.resume")} />
          <ResumeCard />
        </View>

        {canBookmark ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              gate="free"
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
            <LibraryPersonalListRow onPress={handleListsPress} />
          </View>
        ) : null}

        {canOffline ? (
          <View style={styles.sectionBlock}>
            <LibrarySectionHeader
              gate="premium"
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
  topBarAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActionGlyph: {
    textAlign: "center",
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
