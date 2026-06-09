import { useEffect } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";
import { ResumeCard } from "../../src/components/library/resume-card";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { ProfileIdentity } from "../../src/components/profile/profile-identity";
import { ProfileLibraryRows } from "../../src/components/profile/profile-library-rows";
import { ProfileStatStrip } from "../../src/components/profile/profile-stat-strip";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useBookmarks } from "../../src/features/bookmarks/use-bookmarks";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { usePersonalLists } from "../../src/features/personal-lists/use-personal-lists";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { HapticsService } from "../../src/features/haptics/haptics";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ProfileScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const { isLoaded } = useClerkAuth();
  const { theme } = useAppTheme();

  if (!isLoaded) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>
            {t("common:status.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  return <ProfileDashboard />;
}

function ProfileDashboard() {
  const { t } = useTranslation("profile");
  const { isSignedIn, email, fullName, user, signOut } = useClerkAuth();
  const { theme, tenantName } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { isAuthenticated } = useConvexAuth();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const ensureCurrentUser = useMutation(api.users.mutations.ensureCurrentUser);
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");
  const { bookmarks, isMember } = useBookmarks();
  const { lists } = usePersonalLists();
  const { downloads } = useDownloads({ enabled: isSignedIn && isMember });
  const { openPaywall } = usePaywallSheet();

  useEffect(() => {
    if (isAuthenticated) {
      void ensureCurrentUser({});
    }
  }, [ensureCurrentUser, isAuthenticated]);

  const savedCount = bookmarks.length;
  const downloadedCount = downloads.length;
  const historyCount = 0;
  const name = fullName ?? me?.name ?? email ?? t("guestName");
  const avatarUrl = user?.imageUrl ?? me?.avatarUrl ?? null;
  const brandInitial = (tenantName.trim().charAt(0) || "M").toUpperCase();

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
            {t("title")}
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
              {brandInitial}
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
            {t("guestTitle")}
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
            {t("guestBio")}
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
            <Link href="/sign-in" asChild>
              <Pressable
                accessibilityRole="link"
                onPress={() => void HapticsService.medium()}
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
                  testID="profile-create-account-button"
                  style={[
                    styles.primaryButtonLabel,
                    {
                      color: theme.colors.canvas,
                      fontSize: 15 * scaleFont,
                    },
                  ]}
                >
                  {t("createAccount")}
                </Text>
              </Pressable>
            </Link>

            <Pressable
              testID="profile-discover-premium-button"
              accessibilityRole="button"
              onPress={() => {
                void HapticsService.medium();
                openPaywall("support");
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: withAlpha(theme.colors.premium, theme.isDark ? 0.35 : 0.25),
                  backgroundColor: theme.colors.premium,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonLabel,
                  {
                    color: theme.colors.canvas,
                    fontSize: 14 * scaleFont,
                  },
                ]}
              >
                {t("discoverPremium")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            gap: theme.spacing.lg * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileIdentity
          title={t("title")}
          name={name}
          status={isMember ? t("status.memberPremium") : t("status.memberFree")}
          since={isMember ? t("since.member") : t("since.upgrade")}
          avatarUrl={avatarUrl}
          editableAvatar
        />

        <ResumeCard />

        <ProfileStatStrip
          savedCount={savedCount}
          offlineCount={downloadedCount}
          historyCount={historyCount}
          labels={{
            saved: t("stats.savedLabel"),
            offline: t("stats.offlineLabel"),
            history: t("stats.historyLabel"),
          }}
        />

        <ProfileLibraryRows
          isMember={isMember}
          savedCount={savedCount}
          downloadCount={downloadedCount}
          listsCount={lists.length}
          onSignOut={() => {
            void signOut();
          }}
          onGoPremium={() => {
            void HapticsService.medium();
            openPaywall("support");
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
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
});
