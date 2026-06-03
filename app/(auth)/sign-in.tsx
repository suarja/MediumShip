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
import { Link, router } from "expo-router";
import * as Linking from "expo-linking";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import { useAppTheme } from "../../src/features/theme/theme-provider";

// Completes any pending OAuth web-browser session on return to the app.
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = "google" | "apple";

export default function SignInScreen() {
  const { t } = useTranslation("auth");
  const { signIn, setActive, isLoaded } = useSignIn();
  const { theme, tenantName } = useAppTheme();
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
        setError(t("signIn.errors.oauthFailed"));
      } finally {
        setLoadingProvider(null);
      }
    },
    [startGoogle, startApple, t],
  );

  const onEmailPassword = useCallback(async () => {
    if (!isLoaded) {
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError(t("signIn.errors.missingCredentials"));
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
        setError(t("signIn.errors.incomplete"));
      }
    } catch (err: unknown) {
      const clerkError = (err as { errors?: { longMessage?: string }[] })
        ?.errors?.[0];
      setError(clerkError?.longMessage ?? t("signIn.errors.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, email, password, signIn, setActive, t]);

  const busy = submitting || loadingProvider !== null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
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
              <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
                {tenantName}
              </Text>
              <Text style={[styles.title, { color: theme.colors.heading }]}>
                {t("signIn.title")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {t("signIn.subtitle")}
              </Text>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.dangerSoft,
                    borderColor: theme.colors.danger,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.providers}>
              <Pressable
                disabled={busy}
                onPress={() => void onOAuth("google")}
                style={({ pressed }) => [
                  styles.providerButton,
                  {
                    borderRadius: theme.radii.md,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator color={theme.colors.heading} />
                ) : (
                  <Text style={[styles.providerText, { color: theme.colors.heading }]}>
                    {t("signIn.continueWithGoogle")}
                  </Text>
                )}
              </Pressable>

              {Platform.OS === "ios" && (
                <Pressable
                  disabled={busy}
                  onPress={() => void onOAuth("apple")}
                  style={({ pressed }) => [
                    styles.providerButton,
                    {
                      borderRadius: theme.radii.md,
                      borderColor: theme.colors.heading,
                      backgroundColor: theme.colors.heading,
                    },
                    pressed && styles.pressed,
                    busy && styles.disabled,
                  ]}
                >
                  {loadingProvider === "apple" ? (
                    <ActivityIndicator color={theme.colors.surface} />
                  ) : (
                    <Text
                      style={[styles.providerText, { color: theme.colors.surface }]}
                    >
                      {t("signIn.continueWithApple")}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
                {t("signIn.or")}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t("signIn.email")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderRadius: theme.radii.md,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.heading,
                  },
                ]}
                placeholder={t("signIn.emailPlaceholder")}
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                editable={!busy}
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t("signIn.password")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderRadius: theme.radii.md,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.heading,
                  },
                ]}
                placeholder={t("signIn.passwordPlaceholder")}
                placeholderTextColor={theme.colors.textMuted}
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
                  {
                    borderRadius: theme.radii.lg,
                    backgroundColor: theme.colors.accent,
                  },
                  pressed && styles.pressed,
                  (busy || !isLoaded) && styles.disabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.accentContrast} />
                ) : (
                  <Text
                    style={[styles.submitText, { color: theme.colors.accentContrast }]}
                  >
                    {t("signIn.submit")}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
                {t("signIn.noAccount")}
              </Text>
              <Link href="/sign-up" style={[styles.footerLink, { color: theme.colors.accent }]}>
                {t("signIn.createAccount")}
              </Link>
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
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { fontSize: 32, fontWeight: "700" },
  subtitle: { fontSize: 16, lineHeight: 24 },
  errorBox: {
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 14, textAlign: "center" },
  providers: { gap: 12 },
  providerButton: {
    height: 52,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  providerText: { fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  submit: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitText: { fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
