import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function ProfileScreen() {
  const { t } = useTranslation(["profile", "common"]);
  const { isAuthenticated } = useConvexAuth();
  const { email, fullName, signOut } = useClerkAuth();
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
          <Text style={styles.buttonText}>{t("common:actions.signOut")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, justifyContent: "center" },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { fontSize: 28, fontWeight: "700" },
  description: { fontSize: 16, lineHeight: 24 },
  card: { gap: 8, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  cardText: { fontSize: 15, lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  code: { fontFamily: "Courier", fontSize: 12 },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
