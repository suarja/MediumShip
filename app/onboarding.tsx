import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getDefaultAppRoute } from "../src/features/navigation/default-app-route";
import { setOnboardingSeen } from "../src/features/onboarding/onboarding-storage";
import { HapticsService } from "../src/features/haptics/haptics";
import { useResponsive } from "../src/features/responsive/use-responsive";
import { withAlpha } from "../src/features/theme/contrast";
import { fontFamilies } from "../src/features/theme/fonts";
import { typeScale } from "../src/features/theme/type-scale";
import { useAppTheme } from "../src/features/theme/theme-provider";

const STEP_COUNT = 3;

export default function OnboardingScreen() {
  const { t } = useTranslation("onboarding");
  const { theme, effectiveNavigation } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace, contentMaxWidth } = useResponsive();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedThemes, setSelectedThemes] = useState<Set<number>>(new Set());
  const [selectedReads, setSelectedReads] = useState<Set<number>>(new Set());

  const finish = useCallback(
    async (target: "feed" | "sign-in") => {
      await setOnboardingSeen();
      router.replace(
        target === "sign-in" ? "/sign-in" : getDefaultAppRoute(effectiveNavigation),
      );
    },
    [effectiveNavigation, router],
  );

  const goNext = () => {
    void HapticsService.light();
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };

  const goBack = () => {
    void HapticsService.light();
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggle = (set: Set<number>, apply: (next: Set<number>) => void, index: number) => {
    void HapticsService.selection();
    const next = new Set(set);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    apply(next);
  };

  const maxWidth = contentMaxWidth ?? (isTablet ? 640 : undefined);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.canvas }]}>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: theme.spacing.lg * scaleSpace,
            maxWidth,
            alignSelf: "center",
          },
        ]}
      >
        {/* Top bar: back · progress dots · skip */}
        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable
              onPress={goBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.topAction}
            >
              <Ionicons color={theme.colors.heading} name="chevron-back" size={24 * scaleFont} />
            </Pressable>
          ) : (
            <View style={styles.topAction} />
          )}

          <View style={styles.dots}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === step
                        ? theme.colors.heading
                        : withAlpha(theme.colors.heading, 0.2),
                    width: i === step ? 18 * scaleSpace : 6 * scaleSpace,
                  },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={() => {
              void HapticsService.light();
              void finish("feed");
            }}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.skip}
          >
            <Text
              style={[
                styles.skipLabel,
                { color: theme.colors.textMuted, fontSize: typeScale.meta * scaleFont },
              ]}
            >
              {t("skip")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingVertical: theme.spacing.lg * scaleSpace, gap: theme.spacing.lg * scaleSpace }}
          showsVerticalScrollIndicator={false}
        >
          {step === 0 ? (
            <ManifestoStep />
          ) : step === 1 ? (
            <SelectionStep
              selectedThemes={selectedThemes}
              selectedReads={selectedReads}
              onToggleTheme={(i) => toggle(selectedThemes, setSelectedThemes, i)}
              onToggleRead={(i) => toggle(selectedReads, setSelectedReads, i)}
            />
          ) : (
            <PremiumStep />
          )}
        </ScrollView>

        {/* Footer CTAs */}
        <View style={[styles.footer, { paddingBottom: theme.spacing.md * scaleSpace }]}>
          {step === 2 ? (
            <>
              <PrimaryButton
                label={t("premium.tryCta")}
                onPress={() => {
                  void HapticsService.medium();
                  void finish("sign-in");
                }}
              />
              <Pressable
                onPress={() => {
                  void HapticsService.light();
                  void finish("feed");
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
              >
                <Text
                  style={[
                    styles.ghostLabel,
                    { color: theme.colors.textMuted, fontSize: typeScale.cta * scaleFont },
                  ]}
                >
                  {t("premium.laterCta")}
                </Text>
              </Pressable>
            </>
          ) : (
            <PrimaryButton
              label={step === 0 ? t("manifesto.cta") : t("selection.cta")}
              onPress={goNext}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ----------------------------- Steps ----------------------------- */

function ManifestoStep() {
  const { t } = useTranslation("onboarding");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont } = useResponsive();

  return (
    <View style={{ gap: 14 }}>
      <Kicker label={t("manifesto.kicker")} />
      <Text
        style={[
          styles.title,
          { color: theme.colors.heading, fontSize: (isTablet ? 36 : 30) * scaleFont },
        ]}
      >
        {t("manifesto.title")}{" "}
        <Text style={[styles.titleAccent, { color: theme.colors.premium }]}>
          {t("manifesto.titleAccent")}
        </Text>
      </Text>
      <Text
        style={[
          styles.body,
          { color: theme.colors.textMuted, fontSize: typeScale.body * scaleFont },
        ]}
      >
        {t("manifesto.body")}
      </Text>
    </View>
  );
}

function SelectionStep({
  selectedThemes,
  selectedReads,
  onToggleTheme,
  onToggleRead,
}: {
  selectedThemes: Set<number>;
  selectedReads: Set<number>;
  onToggleTheme: (index: number) => void;
  onToggleRead: (index: number) => void;
}) {
  const { t } = useTranslation("onboarding");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const themes = t("selection.placeholderThemes", { returnObjects: true }) as string[];
  const reads = t("selection.placeholderReads", { returnObjects: true }) as string[];

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Kicker label={t("selection.kicker")} />
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontSize: (isTablet ? 30 : 26) * scaleFont },
          ]}
        >
          {t("selection.title")}
        </Text>
      </View>

      {/* Block A — themes */}
      <View style={{ gap: 10 }}>
        <Text
          style={[styles.blockLabel, { color: theme.colors.textMuted, fontSize: typeScale.meta * scaleFont }]}
        >
          {t("selection.themesLabel")}
        </Text>
        <View style={[styles.chips, { gap: 8 * scaleSpace }]}>
          {themes.map((label, i) => {
            const active = selectedThemes.has(i);
            return (
              <Pressable
                key={label}
                onPress={() => onToggleTheme(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderRadius: theme.radii.pill,
                    borderColor: active ? theme.colors.heading : withAlpha(theme.colors.heading, 0.14),
                    backgroundColor: active ? theme.colors.heading : "transparent",
                    paddingHorizontal: 14 * scaleSpace,
                    paddingVertical: 9 * scaleSpace,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: active ? theme.colors.canvas : theme.colors.textMuted,
                      fontSize: typeScale.meta * scaleFont,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Block B — reads */}
      <View style={{ gap: 10 }}>
        <Text
          style={[styles.blockLabel, { color: theme.colors.textMuted, fontSize: typeScale.meta * scaleFont }]}
        >
          {t("selection.readsLabel")}
        </Text>
        <View style={{ gap: 8 * scaleSpace }}>
          {reads.map((readTitle, i) => {
            const active = selectedReads.has(i);
            return (
              <Pressable
                key={readTitle}
                onPress={() => onToggleRead(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.readCard,
                  {
                    borderRadius: theme.radii.md,
                    borderColor: active ? theme.colors.heading : theme.colors.border,
                    backgroundColor: active
                      ? withAlpha(theme.colors.heading, theme.isDark ? 0.16 : 0.05)
                      : theme.colors.surface,
                    padding: 14 * scaleSpace,
                    gap: 4 * scaleSpace,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.readHead}>
                  <Text
                    style={[styles.readKicker, { color: theme.colors.accent, fontSize: typeScale.meta * scaleFont }]}
                  >
                    {t("selection.readKicker")}
                  </Text>
                  <Ionicons
                    color={active ? theme.colors.heading : withAlpha(theme.colors.heading, 0.3)}
                    name={active ? "checkmark-circle" : "ellipse-outline"}
                    size={20 * scaleFont}
                  />
                </View>
                <Text
                  style={[styles.readTitle, { color: theme.colors.heading, fontSize: typeScale.title * scaleFont }]}
                >
                  {readTitle}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function PremiumStep() {
  const { t } = useTranslation("onboarding");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const benefits = t("premium.benefits", { returnObjects: true }) as string[];

  return (
    <View style={{ gap: 16 }}>
      <Kicker label={t("premium.kicker")} tone={theme.colors.premium} />
      <Text
        style={[
          styles.title,
          { color: theme.colors.heading, fontSize: (isTablet ? 32 : 28) * scaleFont },
        ]}
      >
        {t("premium.title")}{" "}
        <Text style={[styles.titleAccent, { color: theme.colors.premium }]}>
          {t("premium.titleAccent")}
        </Text>
      </Text>

      <View style={{ gap: 12 * scaleSpace, marginTop: 4 }}>
        {benefits.map((benefit) => (
          <View key={benefit} style={[styles.benefitRow, { gap: 10 * scaleSpace }]}>
            <Ionicons color={theme.colors.premium} name="checkmark" size={18 * scaleFont} />
            <Text
              style={[styles.benefit, { color: theme.colors.text, fontSize: typeScale.body * scaleFont }]}
            >
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={[styles.note, { color: theme.colors.textMuted, fontSize: typeScale.caption * scaleFont }]}
      >
        {t("premium.note")}
      </Text>
    </View>
  );
}

/* --------------------------- Primitives --------------------------- */

function Kicker({ label, tone }: { label: string; tone?: string }) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  return (
    <Text
      style={[
        styles.kicker,
        { color: tone ?? theme.colors.accent, fontSize: typeScale.meta * scaleFont },
      ]}
    >
      {label}
    </Text>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        {
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.heading,
          paddingVertical: 15 * scaleSpace,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.primaryLabel, { color: theme.colors.canvas, fontSize: typeScale.cta * scaleFont }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, width: "100%" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  topAction: { minWidth: 44, height: 36, justifyContent: "center" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  skip: { minWidth: 44, height: 36, alignItems: "flex-end", justifyContent: "center" },
  skipLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.5,
  },
  titleAccent: { fontFamily: fontFamilies.displayBoldItalic },
  body: { fontFamily: fontFamilies.body, lineHeight: 24 },
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  blockLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: StyleSheet.hairlineWidth },
  chipLabel: { fontFamily: fontFamilies.bodyMedium },
  readCard: { borderWidth: StyleSheet.hairlineWidth },
  readHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  readKicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  readTitle: { fontFamily: fontFamilies.display, lineHeight: 23 },
  benefitRow: { flexDirection: "row", alignItems: "center" },
  benefit: { fontFamily: fontFamilies.body, flex: 1 },
  note: { fontFamily: fontFamilies.body, lineHeight: 19, marginTop: 4 },
  footer: { gap: 10, paddingTop: 8 },
  primary: { alignItems: "center", justifyContent: "center", minHeight: 50 },
  primaryLabel: { fontFamily: fontFamilies.bodySemiBold },
  ghost: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  ghostLabel: { fontFamily: fontFamilies.bodyMedium },
  pressed: { opacity: 0.85 },
});
