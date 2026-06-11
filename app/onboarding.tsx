import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../convex/_generated/api";
import { CategoryInterestsPicker } from "../src/components/settings/category-interests-picker";
import { FeedHeroCard } from "../src/components/content/feed-hero-card";
import { cardKicker, cardMeta } from "../src/features/content/card-presentation";
import { toContentCardModel } from "../src/features/content/selectors";
import type { ContentDoc } from "../src/features/content/types";
import { useCategoryInterestSelection } from "../src/features/categories/use-category-interest-selection";
import { useCategoryInterestTreeNodes } from "../src/features/categories/use-category-interests";
import { getDefaultAppRoute } from "../src/features/navigation/default-app-route";
import { setOnboardingSeen } from "../src/features/onboarding/onboarding-storage";
import { HapticsService } from "../src/features/haptics/haptics";
import { useResponsive } from "../src/features/responsive/use-responsive";
import { withAlpha } from "../src/features/theme/contrast";
import { fontFamilies } from "../src/features/theme/fonts";
import { typeScale } from "../src/features/theme/type-scale";
import { useAppTheme } from "../src/features/theme/theme-provider";

const STEP_COUNT = 3;
const ONBOARDING_VIEWER = { isAuthenticated: false, isPro: false };

export default function OnboardingScreen() {
  const { t } = useTranslation("onboarding");
  const { theme, effectiveNavigation } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace, contentMaxWidth } = useResponsive();
  const router = useRouter();

  const [step, setStep] = useState(0);

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
          contentContainerStyle={{
            paddingVertical: theme.spacing.lg * scaleSpace,
            gap: theme.spacing.lg * scaleSpace,
          }}
          showsVerticalScrollIndicator={false}
        >
          {step === 0 ? (
            <ManifestoStep />
          ) : step === 1 ? (
            <CategoryStep />
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
              label={step === 0 ? t("manifesto.cta") : t("categories.cta")}
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
  const { t: tHome } = useTranslation("home");
  const { theme, tenantSlug } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const { width } = useWindowDimensions();

  const contents = useQuery(api.content.queries.listPublishedFeed, { tenantSlug }) as
    | ContentDoc[]
    | undefined;
  const reads = (contents ?? []).slice(0, 6).map(toContentCardModel);

  const cardWidth = Math.min(width * 0.82, isTablet ? 380 : 320);
  const gap = 12 * scaleSpace;

  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 14 }}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: (isTablet ? 48 : 40) * scaleFont,
              // Generous leading for an editorial, airy display title.
              lineHeight: (isTablet ? 62 : 52) * scaleFont,
            },
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

      {reads.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text
            style={[styles.blockLabel, { color: theme.colors.textMuted, fontSize: typeScale.meta * scaleFont }]}
          >
            {t("manifesto.readsLabel")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -(theme.spacing.lg * scaleSpace) }}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg * scaleSpace,
              gap,
            }}
            snapToInterval={cardWidth + gap}
            decelerationRate="fast"
          >
            {reads.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <FeedHeroCard
                  item={item}
                  kicker={cardKicker(item, tHome)}
                  meta={cardMeta(item, tHome, ONBOARDING_VIEWER)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function CategoryStep() {
  const { t } = useTranslation("onboarding");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont } = useResponsive();
  const { options, selectedKeys, applyCategoryInterests } = useCategoryInterestSelection();
  const treeNodes = useCategoryInterestTreeNodes();

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Kicker label={t("categories.kicker")} />
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontSize: (isTablet ? 32 : 28) * scaleFont },
          ]}
        >
          {t("categories.title")}
        </Text>
      </View>

      <CategoryInterestsPicker
        options={options}
        treeNodes={treeNodes}
        selectedKeys={selectedKeys}
        applyCategoryInterests={applyCategoryInterests}
        size="large"
      />
    </View>
  );
}

function PremiumStep() {
  const { t } = useTranslation("onboarding");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const benefits = t("premium.benefits", { returnObjects: true }) as string[];
  const badgeSize = 40 * scaleSpace;

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <Kicker label={t("premium.kicker")} tone={theme.colors.premium} />
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: (isTablet ? 40 : 34) * scaleFont,
              lineHeight: (isTablet ? 44 : 38) * scaleFont,
            },
          ]}
        >
          {t("premium.title")}
        </Text>
        <Text
          style={[styles.body, { color: theme.colors.textMuted, fontSize: typeScale.body * scaleFont }]}
        >
          {t("premium.subtitle")}
        </Text>
      </View>

      <View style={{ gap: 16 * scaleSpace, marginTop: 4 }}>
        {benefits.map((benefit) => (
          <View key={benefit} style={[styles.benefitRow, { gap: 14 * scaleSpace }]}>
            <View
              style={[
                styles.benefitBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeSize / 2,
                  backgroundColor: withAlpha(theme.colors.premium, theme.isDark ? 0.24 : 0.12),
                },
              ]}
            >
              <Ionicons color={theme.colors.premium} name="checkmark" size={20 * scaleFont} />
            </View>
            <Text
              style={[
                styles.benefit,
                { color: theme.colors.heading, fontSize: (isTablet ? 18 : 17) * scaleFont },
              ]}
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
  benefitRow: { flexDirection: "row", alignItems: "center" },
  benefitBadge: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  benefit: { fontFamily: fontFamilies.bodyMedium, flex: 1, lineHeight: 24 },
  note: { fontFamily: fontFamilies.body, lineHeight: 19, marginTop: 4 },
  footer: { gap: 10, paddingTop: 8 },
  primary: { alignItems: "center", justifyContent: "center", minHeight: 50 },
  primaryLabel: { fontFamily: fontFamilies.bodySemiBold },
  ghost: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  ghostLabel: { fontFamily: fontFamilies.bodyMedium },
  pressed: { opacity: 0.85 },
});
