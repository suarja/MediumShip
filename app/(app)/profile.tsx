import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";

export default function ProfileScreen() {
  const { isAuthenticated } = useConvexAuth();
  const { email, fullName, signOut } = useClerkAuth();

  // Authenticated read — skipped until the Convex token is in place so the
  // subscription is never created unauthenticated (which would kill it).
  const me = useQuery(api.users.queries.getMe, isAuthenticated ? {} : "skip");
  const upsertCurrentUser = useMutation(api.users.mutations.upsertCurrentUser);

  // Record the user in Convex once the authenticated session is live.
  useEffect(() => {
    if (isAuthenticated) {
      void upsertCurrentUser({});
    }
  }, [isAuthenticated, upsertCurrentUser]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Auth slice</Text>
        <Text style={styles.title}>{fullName ?? email ?? "Signed in"}</Text>
        <Text style={styles.description}>
          This screen proves the Clerk → Convex JWT path: the identity below is
          resolved server-side via ctx.auth.getUserIdentity().
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Convex identity</Text>
          {!isAuthenticated || me === undefined ? (
            <View style={styles.row}>
              <ActivityIndicator color="#B42318" />
              <Text style={styles.cardText}>Resolving authenticated query…</Text>
            </View>
          ) : me === null ? (
            <Text style={styles.cardText}>No identity returned.</Text>
          ) : (
            <>
              <Text style={styles.cardText}>Email: {me.email ?? "—"}</Text>
              <Text style={styles.cardText}>Name: {me.name ?? "—"}</Text>
              <Text style={styles.cardText}>
                Stored in Convex: {me.isStored ? "yes" : "not yet"}
              </Text>
              <Text style={styles.code}>{me.tokenIdentifier}</Text>
            </>
          )}
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, justifyContent: "center" },
  eyebrow: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { color: "#101828", fontSize: 28, fontWeight: "700" },
  description: { color: "#475467", fontSize: 16, lineHeight: 24 },
  card: { gap: 8, borderRadius: 20, backgroundColor: "#FFFFFF", padding: 20 },
  cardTitle: { color: "#101828", fontSize: 18, fontWeight: "700" },
  cardText: { color: "#344054", fontSize: 15, lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  code: { color: "#667085", fontFamily: "Courier", fontSize: 12 },
  button: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#101828",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
