import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

// Completes any pending OAuth web-browser session on return to the app.
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = "google" | "apple";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogle } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startApple } = useOAuth({ strategy: "oauth_apple" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        setError(null);
        setLoadingProvider(provider);
        const flow = provider === "google" ? startGoogle : startApple;
        const { createdSessionId, setActive: setOAuthActive } = await flow({
          redirectUrl: Linking.createURL("/"),
        });

        if (createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: createdSessionId });
          router.replace("/home");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/cancel|dismiss/i.test(message)) {
          return; // user backed out — not an error
        }
        setError("La connexion a échoué. Réessayez.");
      } finally {
        setLoadingProvider(null);
      }
    },
    [startGoogle, startApple],
  );

  const onEmailPassword = useCallback(async () => {
    if (!isLoaded) {
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Entrez votre email et votre mot de passe.");
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      const attempt = await signIn.create({ identifier: email, password });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/home");
      } else {
        setError("Connexion incomplète. Réessayez.");
      }
    } catch (err: unknown) {
      const clerkError = (err as { errors?: { longMessage?: string }[] })
        ?.errors?.[0];
      setError(clerkError?.longMessage ?? "Email ou mot de passe incorrect.");
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, email, password, signIn, setActive]);

  const busy = submitting || loadingProvider !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>MediumShip</Text>
              <Text style={styles.title}>Bon retour</Text>
              <Text style={styles.subtitle}>
                Connectez-vous pour accéder à votre média.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.providers}>
              <Pressable
                disabled={busy}
                onPress={() => void onOAuth("google")}
                style={({ pressed }) => [
                  styles.providerButton,
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator color="#101828" />
                ) : (
                  <Text style={styles.providerText}>Continuer avec Google</Text>
                )}
              </Pressable>

              {Platform.OS === "ios" && (
                <Pressable
                  disabled={busy}
                  onPress={() => void onOAuth("apple")}
                  style={({ pressed }) => [
                    styles.providerButton,
                    styles.providerButtonDark,
                    pressed && styles.pressed,
                    busy && styles.disabled,
                  ]}
                >
                  {loadingProvider === "apple" ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.providerText, styles.providerTextDark]}>
                      Continuer avec Apple
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#98A2B3"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                editable={!busy}
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#98A2B3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                editable={!busy}
              />

              <Pressable
                disabled={busy || !isLoaded}
                onPress={() => void onEmailPassword()}
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.pressed,
                  (busy || !isLoaded) && styles.disabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Se connecter</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FCFCFD" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  // Cap width and center so the form reads well on iPad as well as iPhone.
  content: { width: "100%", maxWidth: 480, alignSelf: "center", gap: 24 },
  header: { gap: 8 },
  eyebrow: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { color: "#101828", fontSize: 32, fontWeight: "700" },
  subtitle: { color: "#475467", fontSize: 16, lineHeight: 24 },
  errorBox: {
    backgroundColor: "rgba(180,35,24,0.08)",
    borderColor: "rgba(180,35,24,0.25)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: "#B42318", fontSize: 14, textAlign: "center" },
  providers: { gap: 12 },
  providerButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  providerButtonDark: { backgroundColor: "#101828", borderColor: "#101828" },
  providerText: { color: "#101828", fontSize: 16, fontWeight: "600" },
  providerTextDark: { color: "#FFFFFF" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EAECF0" },
  dividerText: { color: "#98A2B3", fontSize: 13 },
  form: { gap: 8 },
  label: { color: "#344054", fontSize: 14, fontWeight: "500", marginTop: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#101828",
    fontSize: 16,
  },
  submit: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#B42318",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
