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

import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

function clerkErrorMessage(err: unknown, fallback: string): string {
  const first = (err as { errors?: { longMessage?: string }[] })?.errors?.[0];
  return first?.longMessage ?? fallback;
}

export default function SignUpScreen() {
  const { t } = useTranslation("auth");
  const { signUp, setActive, isLoaded } = useSignUp();
  const { theme, tenantName } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = useCallback(async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password.trim()) {
      setError(t("signUp.errors.missingCredentials"));
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(clerkErrorMessage(err, t("signUp.errors.createFailed")));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, email, password, signUp, t]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;
    if (!code.trim()) {
      setError(t("signUp.errors.missingCode"));
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/home");
      } else {
        setError(t("signUp.errors.verificationIncomplete"));
      }
    } catch (err) {
      setError(clerkErrorMessage(err, t("signUp.errors.invalidCode")));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, code, signUp, setActive, t]);

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
                {pendingVerification
                  ? t("signUp.verifyTitle")
                  : t("signUp.createTitle")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {pendingVerification
                  ? t("signUp.verifySubtitle", { email })
                  : t("signUp.createSubtitle")}
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

            {pendingVerification ? (
              <View style={styles.form}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  {t("signUp.verificationCode")}
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
                  placeholder={t("signUp.verificationCodePlaceholder")}
                  placeholderTextColor={theme.colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  editable={!submitting}
                />
                <Pressable
                  disabled={submitting || !isLoaded}
                  onPress={() => void onVerify()}
                  style={({ pressed }) => [
                    styles.submit,
                    {
                      borderRadius: theme.radii.lg,
                      backgroundColor: theme.colors.accent,
                    },
                    pressed && styles.pressed,
                    (submitting || !isLoaded) && styles.disabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.colors.accentContrast} />
                  ) : (
                    <Text
                      style={[styles.submitText, { color: theme.colors.accentContrast }]}
                    >
                      {t("signUp.submitVerify")}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
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
                  editable={!submitting}
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
                  textContentType="newPassword"
                  autoComplete="password-new"
                  editable={!submitting}
                />

                <Pressable
                  disabled={submitting || !isLoaded}
                  onPress={() => void onCreate()}
                  style={({ pressed }) => [
                    styles.submit,
                    {
                      borderRadius: theme.radii.lg,
                      backgroundColor: theme.colors.accent,
                    },
                    pressed && styles.pressed,
                    (submitting || !isLoaded) && styles.disabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.colors.accentContrast} />
                  ) : (
                    <Text
                      style={[styles.submitText, { color: theme.colors.accentContrast }]}
                    >
                      {t("signUp.submitCreate")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
                {t("signUp.alreadyHaveAccount")}
              </Text>
              <Link href="/sign-in" style={[styles.footerLink, { color: theme.colors.accent }]}>
                {t("signUp.signIn")}
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", gap: 24 },
  header: { gap: 8 },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: { fontFamily: fontFamilies.display, fontSize: 32, letterSpacing: -0.4 },
  subtitle: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24 },
  errorBox: {
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontFamily: fontFamilies.body, fontSize: 14, textAlign: "center" },
  form: { gap: 8 },
  label: { fontFamily: fontFamilies.bodyMedium, fontSize: 14, marginTop: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fontFamilies.body,
  },
  submit: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitText: { fontFamily: fontFamilies.bodySemiBold, fontSize: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerText: { fontFamily: fontFamilies.body, fontSize: 14 },
  footerLink: { fontFamily: fontFamilies.bodySemiBold, fontSize: 14 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
