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

function clerkErrorMessage(err: unknown, fallback: string): string {
  const first = (err as { errors?: { longMessage?: string }[] })?.errors?.[0];
  return first?.longMessage ?? fallback;
}

export default function SignUpScreen() {
  const { t } = useTranslation("auth");
  const { signUp, setActive, isLoaded } = useSignUp();

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
              <Text style={styles.title}>
                {pendingVerification
                  ? t("signUp.verifyTitle")
                  : t("signUp.createTitle")}
              </Text>
              <Text style={styles.subtitle}>
                {pendingVerification
                  ? t("signUp.verifySubtitle", { email })
                  : t("signUp.createSubtitle")}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {pendingVerification ? (
              <View style={styles.form}>
                <Text style={styles.label}>{t("signUp.verificationCode")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("signUp.verificationCodePlaceholder")}
                  placeholderTextColor="#98A2B3"
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
                    pressed && styles.pressed,
                    (submitting || !isLoaded) && styles.disabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>{t("signUp.submitVerify")}</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>{t("signIn.email")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("signIn.emailPlaceholder")}
                  placeholderTextColor="#98A2B3"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="email"
                  editable={!submitting}
                />

                <Text style={styles.label}>{t("signIn.password")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("signIn.passwordPlaceholder")}
                  placeholderTextColor="#98A2B3"
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
                    pressed && styles.pressed,
                    (submitting || !isLoaded) && styles.disabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>{t("signUp.submitCreate")}</Text>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("signUp.alreadyHaveAccount")}</Text>
              <Link href="/sign-in" style={styles.footerLink}>
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
  safeArea: { flex: 1, backgroundColor: "#FCFCFD" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerText: { color: "#475467", fontSize: 14 },
  footerLink: { color: "#B42318", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
