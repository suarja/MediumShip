import { useEffect } from "react";
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
import { MemberGateCard } from "../../src/components/auth/member-gate-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { SavedContentSection } from "../../src/components/profile/saved-content-section";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ProfileScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const { isLoaded, isSignedIn, email, fullName, signOut } = useClerkAuth();
  const { theme } = useAppTheme();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const contentBottomSpace = tabBarSpace + persistentPlayerSpace;

  if (!isLoaded) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.cardText, { color: theme.colors.textMuted }]}>
            {t("common:status.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  if (!isSignedIn) {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: contentBottomSpace },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
              {t("profile:eyebrow")}
            </Text>
            <Text style={[styles.title, { color: theme.colors.heading }]}>
              {t("profile:guestTitle")}
            </Text>
            <MemberGateCard
              title={t("profile:guestCardTitle")}
              description={t("profile:guestCardDescription")}
              ctaLabel={t("profile:createAccount")}
            />
            <SavedContentSection />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <AuthenticatedProfileContent
      bottomSpace={contentBottomSpace}
      email={email}
      fullName={fullName}
      signOut={signOut}
    />
  );
}

type AuthenticatedProfileContentProps = {
  bottomSpace: number;
  email: string | null;
  fullName: string | null;
  signOut: () => Promise<void>;
};

function AuthenticatedProfileContent({
  bottomSpace,
  email,
  fullName,
  signOut,
}: AuthenticatedProfileContentProps) {
  const { t } = useTranslation(["profile", "common"]);
  const { isAuthenticated } = useConvexAuth();
  const { theme } = useAppTheme();

  // Authenticated read — skipped until the Convex token is in place so the
  // subscription is never created unauthenticated (which would kill it).
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");
  const ensureCurrentUser = useMutation(api.users.mutations.ensureCurrentUser);

  // Lazy-upsert the row once the authenticated session is live, so the slice is
  // testable even before the Clerk webhook is configured.
  useEffect(() => {
    if (isAuthenticated) {
      void ensureCurrentUser({});
    }
  }, [isAuthenticated, ensureCurrentUser]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: bottomSpace },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
            {t("profile:eyebrow")}
          </Text>
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {fullName ?? email ?? t("profile:fallbackTitle")}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t("profile:description")}
          </Text>

          <View
            style={[
              styles.card,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.heading }]}>
              {t("profile:cardTitle")}
            </Text>
            {!isAuthenticated || me === undefined ? (
              <View style={styles.row}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {t("profile:loadingIdentity")}
                </Text>
              </View>
            ) : me === null ? (
              <Text style={[styles.cardText, { color: theme.colors.text }]}>
                {t("profile:noIdentity")}
              </Text>
            ) : (
              <>
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {t("profile:email", { value: me.email ?? "—" })}
                </Text>
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {t("profile:name", { value: me.name ?? "—" })}
                </Text>
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {t("profile:storedInConvex", {
                    value: me.isStored
                      ? t("profile:storedYes")
                      : t("profile:storedNo"),
                  })}
                </Text>
                <Text style={[styles.code, { color: theme.colors.textMuted }]}>
                  {me.tokenIdentifier}
                </Text>
              </>
            )}
          </View>

          <SavedContentSection />

          <Pressable
            onPress={() => void signOut()}
            style={({ pressed }) => [
              styles.button,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.heading,
              },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.canvas }]}>
              {t("common:actions.signOut")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 24,
  },
  container: { flex: 1, gap: 16, justifyContent: "center" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: { fontFamily: fontFamilies.display, fontSize: 28, letterSpacing: -0.4 },
  description: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24 },
  card: { gap: 8, padding: 20 },
  cardTitle: { fontFamily: fontFamilies.display, fontSize: 18, letterSpacing: -0.2 },
  cardText: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  code: { fontFamily: fontFamilies.mono, fontSize: 12 },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontFamily: fontFamilies.bodySemiBold, fontSize: 15 },
});
