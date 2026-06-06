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
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { ProfileHero } from "../../src/components/profile/profile-hero";
import { ProfileStatCards } from "../../src/components/profile/profile-stat-cards";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useBookmarks } from "../../src/features/bookmarks/use-bookmarks";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
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
  const { isLoaded, isSignedIn, email, fullName, user } = useClerkAuth();
  const { appIconUrl, tenantName, theme } = useAppTheme();
  const { isAuthenticated } = useConvexAuth();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const ensureCurrentUser = useMutation(api.users.mutations.ensureCurrentUser);
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");
  const { bookmarks, isMember, isMembershipLoading } = useBookmarks();
  const { downloads } = useDownloads({ enabled: isSignedIn && isMember });

  useEffect(() => {
    if (isAuthenticated) {
      void ensureCurrentUser({});
    }
  }, [ensureCurrentUser, isAuthenticated]);

  const savedCount = bookmarks.length;
  const downloadedCount = downloads.length;
  const heroTitle =
    fullName ?? me?.name ?? email ?? t("guestName");
  const heroBio = !isSignedIn
    ? t("guestBio")
    : savedCount > 0 || downloadedCount > 0
      ? t("memberBioActive")
      : isMember
        ? t("memberBio")
        : t("signedInBio");
  const heroMeta = !isSignedIn
    ? t("heroMetaGuest")
    : isMember
      ? t("heroMetaMember")
      : t("heroMetaSignedIn");
  const avatarUrl = user?.imageUrl ?? me?.avatarUrl ?? appIconUrl ?? null;
  const heroChips = [
    { iconName: "library-outline" as const, label: tenantName },
    {
      iconName: savedCount > 0 ? ("bookmark" as const) : ("bookmark-outline" as const),
      label: t("heroChipSaved", { count: savedCount }),
    },
    {
      iconName:
        downloadedCount > 0 ? ("download" as const) : ("download-outline" as const),
      label: t("heroChipDownloaded", { count: downloadedCount }),
    },
  ];
  const bannerImageUrl =
    bookmarks[0]?.content
      ? getContentCoverImageUrl(bookmarks[0].content)
      : downloads[0]?.localCoverImagePath ??
        (downloads[0]?.content ? getContentCoverImageUrl(downloads[0].content) : undefined) ??
        user?.imageUrl ??
        appIconUrl;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            gap: 20,
            paddingBottom: tabBarSpace + persistentPlayerSpace,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          avatarUrl={avatarUrl}
          bannerImageUrl={bannerImageUrl}
          bio={heroBio}
          eyebrow={t("eyebrow")}
          heroChips={heroChips}
          meta={heroMeta}
          tenantName={tenantName}
          title={heroTitle}
        />

        <ProfileStatCards
          downloadCount={downloadedCount}
          isMember={isMember}
          isSignedIn={isSignedIn}
          isSynced={Boolean(isSignedIn && isAuthenticated && me && !isMembershipLoading)}
          labels={{
            saved: t("stats.savedLabel"),
            savedHint: t("stats.savedHint"),
            downloaded: t("stats.downloadedLabel"),
            downloadedHint: t("stats.downloadedHint"),
            access: t("stats.accessLabel"),
            memberHint: t("stats.memberHint"),
            guestHint: t("stats.guestHint"),
            sync: t("stats.syncLabel"),
            syncReady: t("stats.syncReady"),
            syncPending: t("stats.syncPending"),
          }}
          savedCount={savedCount}
        />

        {!isSignedIn ? (
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
        ) : null}
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
