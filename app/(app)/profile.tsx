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
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { fontFamilies } from "../../src/features/theme/fonts";
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
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { isAuthenticated } = useConvexAuth();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const ensureCurrentUser = useMutation(api.users.mutations.ensureCurrentUser);
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");
  const { bookmarks, isMember } = useBookmarks();
  const { downloads } = useDownloads({ enabled: isSignedIn && isMember });

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
        {isSignedIn ? (
          <>
            <ProfileIdentity
              title={t("title")}
              name={name}
              status={isMember ? t("status.memberPremium") : t("status.memberFree")}
              since={isMember ? t("since.member") : t("since.upgrade")}
              avatarUrl={avatarUrl}
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
              onSignOut={() => {
                void signOut();
              }}
            />
          </>
        ) : (
          <>
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
                styles.noteCard,
                {
                  borderRadius: theme.radii.xl,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.noteTitle, { color: theme.colors.heading }]}>
                {t("guestTitle")}
              </Text>
              <Text style={[styles.noteBody, { color: theme.colors.textMuted }]}>
                {t("guestNote")}
              </Text>
              <View style={styles.noteButtonWrap}>
                <Link href="/sign-in" asChild>
                  <Pressable
                    accessibilityRole="link"
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <View
                      testID="profile-create-account-button"
                      style={[
                        styles.noteButton,
                        {
                          borderRadius: theme.radii.pill,
                          backgroundColor: theme.colors.heading,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.noteButtonLabel,
                          { color: theme.colors.canvas },
                        ]}
                      >
                        {t("createAccount")}
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              </View>
            </View>
          </>
        )}
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
  noteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  noteTitle: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  noteBody: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  noteButtonWrap: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  noteButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  noteButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.88,
  },
});
