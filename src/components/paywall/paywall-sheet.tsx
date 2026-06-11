import { Link } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { logBilling } from "../../features/billing/billing-debug";
import { getPurchasesDiagnostics } from "../../features/billing/purchases";
import { usePurchasePremium } from "../../features/billing/use-purchase-premium";
import { useStartFreePremium } from "../../features/billing/use-start-free-premium";
import { PAYMENTS_ENABLED } from "../../features/tenant/feature-access";
import {
  formatPaywallPurchaseLabel,
  isRecommendedPaywallPackage,
  sortPaywallPackages,
} from "../../features/paywall/paywall-purchase-label";
import { HapticsService } from "../../features/haptics/haptics";
import { useIsMember } from "../../features/membership/use-is-member";
import type { PaywallReason } from "../../features/paywall/paywall-copy";
import { resolvePaywallCopyKeys } from "../../features/paywall/paywall-copy";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { PaywallContextPeek } from "./paywall-context-peek";
import { PaywallHeadline } from "./paywall-headline";
import { PaywallPackageOption } from "./paywall-package-option";

type Props = {
  visible: boolean;
  reason: PaywallReason;
  previewTitle?: string;
  previewEyebrow?: string;
  isSignedIn: boolean;
  onDismiss: () => void;
  onPurchaseSuccess?: () => void;
};

function resolveStatusMessage(
  status: ReturnType<typeof usePurchasePremium>["status"],
  errorMessage: string | null,
  t: (key: string) => string,
): string | null {
  switch (status) {
    case "success":
      return t("purchaseSuccess");
    case "cancelled":
      return t("purchaseCancelled");
    case "error":
      return errorMessage ?? t("purchaseError");
    case "already":
      return t("alreadySubscribed");
    default:
      return null;
  }
}

// Contextual paywall bottom sheet — aligned with mockup `screens2.jsx` PaywallSheet.
export function PaywallSheet({
  visible,
  reason,
  previewTitle,
  previewEyebrow,
  isSignedIn,
  onDismiss,
  onPurchaseSuccess,
}: Props) {
  const { t } = useTranslation("paywall");
  const { theme, tenantName } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const insets = useSafeAreaInsets();
  const { isMember: isPremium } = useIsMember();
  const paymentsEnabled = PAYMENTS_ENABLED;
  const {
    packages,
    package: premiumPackage,
    selectPackage,
    isLoadingOffering,
    offeringError,
    purchase,
    restore,
    reloadOffering,
    status,
    errorMessage,
    purchasesSupported,
  } = usePurchasePremium({
    enabled: visible && isSignedIn && paymentsEnabled,
    onPurchaseSuccess,
  });
  const {
    activate: activateFreePremium,
    isPending: isFreePremiumPending,
    status: freePremiumStatus,
  } = useStartFreePremium({ onSuccess: onPurchaseSuccess });

  const keys = resolvePaywallCopyKeys(reason);
  const benefits = t("benefits", { returnObjects: true }) as string[];
  const sortedPackages = useMemo(() => sortPaywallPackages(packages), [packages]);
  const maxWidth = isTablet ? 520 : undefined;
  const statusMessage = resolveStatusMessage(status, errorMessage, t);
  const isPending = paymentsEnabled ? status === "pending" : isFreePremiumPending;
  const purchaseLabel = purchasesSupported
    ? formatPaywallPurchaseLabel(t, premiumPackage)
    : t("purchaseCtaFallback");
  const freePremiumStatusMessage =
    freePremiumStatus === "error" ? t("purchaseError") : null;
  const crestInitial = (tenantName.trim().charAt(0) || "M").toUpperCase();
  const headlineSize = (isTablet ? 26 : 22) * scaleFont;

  useEffect(() => {
    if (!visible) return;
    logBilling("paywall.sheet.visible", {
      reason,
      isSignedIn,
      isPremium,
      purchasesSupported,
      isLoadingOffering,
      offeringError,
      packageId: premiumPackage?.identifier ?? null,
      productId: premiumPackage?.product.identifier ?? null,
      diagnostics: getPurchasesDiagnostics(),
    });
  }, [
    visible,
    reason,
    isSignedIn,
    isPremium,
    purchasesSupported,
    isLoadingOffering,
    offeringError,
    premiumPackage?.identifier,
    premiumPackage?.product.identifier,
  ]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: withAlpha(theme.colors.heading, 0.52) }]}>
        <PaywallContextPeek eyebrow={previewEyebrow} title={previewTitle} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.xl,
              borderTopRightRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 20 * scaleSpace,
              alignSelf: "center",
              width: maxWidth ?? "100%",
              shadowColor: theme.colors.heading,
            },
          ]}
        >
          <View style={styles.grab}>
            <View
              style={[styles.grabBar, { backgroundColor: withAlpha(theme.colors.heading, 0.18) }]}
            />
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { gap: 14 * scaleSpace }]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.crest,
                {
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.premium,
                },
              ]}
            >
              <Text
                style={[
                  styles.crestLabel,
                  { color: theme.colors.heading, fontSize: 18 * scaleFont },
                ]}
              >
                {crestInitial}
              </Text>
            </View>

            <Text
              style={[
                styles.eyebrow,
                { color: theme.colors.accent, fontSize: (isTablet ? 10 : 9) * scaleFont },
              ]}
            >
              {t(keys.eyebrow)}
            </Text>

            <PaywallHeadline
              title={t(keys.title)}
              titleItalic={t(keys.titleItalic)}
              color={theme.colors.heading}
              italicColor={theme.colors.premium}
              fontSize={headlineSize}
            />

            <Text
              style={[
                styles.description,
                { color: theme.colors.textMuted, fontSize: (isTablet ? 13 : 12) * scaleFont },
              ]}
            >
              {t(keys.description)}
            </Text>

            <View style={[styles.benefits, { gap: 6 * scaleSpace }]}>
              {Array.isArray(benefits) &&
                benefits.map((benefit, i) => (
                  <View key={i} style={[styles.benefitRow, { gap: 8 * scaleSpace }]}>
                    <Text
                      style={[
                        styles.checkmark,
                        { color: theme.colors.premium, fontSize: 10 * scaleFont },
                      ]}
                    >
                      ✓
                    </Text>
                    <Text
                      style={[
                        styles.benefitLabel,
                        { color: theme.colors.text, fontSize: (isTablet ? 13 : 11) * scaleFont },
                      ]}
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
            </View>

            {isSignedIn ? (
              <>
                {isPremium ? (
                  <View style={[styles.alreadyPremiumBlock, { gap: 12 * scaleSpace }]}>
                    <Text style={[styles.statusBody, { color: theme.colors.accent, fontSize: 13 * scaleFont }]}>
                      {t("alreadySubscribed")}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      testID="paywall-already-premium-cta"
                      onPress={() => {
                        void HapticsService.medium();
                        onDismiss();
                      }}
                      style={({ pressed }) => [
                        styles.primaryCta,
                        {
                          borderRadius: theme.radii.pill,
                          backgroundColor: theme.colors.heading,
                          paddingVertical: 14 * scaleSpace,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryCtaLabel,
                          { color: theme.colors.canvas, fontSize: (isTablet ? 14 : 13) * scaleFont },
                        ]}
                      >
                        {t("alreadyPremiumCta")}
                      </Text>
                    </Pressable>
                  </View>
                ) : !paymentsEnabled ? (
                  <View style={[styles.offeringErrorBlock, { gap: 10 * scaleSpace }]}>
                    <Pressable
                      accessibilityRole="button"
                      testID="paywall-free-premium-cta"
                      disabled={isPending}
                      onPress={() => {
                        void HapticsService.medium();
                        void activateFreePremium();
                      }}
                      style={({ pressed }) => [
                        styles.primaryCta,
                        {
                          alignSelf: "stretch",
                          borderRadius: theme.radii.pill,
                          backgroundColor: theme.colors.heading,
                          paddingVertical: 16 * scaleSpace,
                          paddingHorizontal: 28 * scaleSpace,
                          opacity: isPending ? 0.7 : 1,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      {isPending ? (
                        <ActivityIndicator color={theme.colors.canvas} />
                      ) : (
                        <Text
                          style={[
                            styles.primaryCtaLabel,
                            { color: theme.colors.canvas, fontSize: (isTablet ? 14 : 13) * scaleFont },
                          ]}
                        >
                          {t("freeTrialCta")}
                        </Text>
                      )}
                    </Pressable>
                    <Text style={[styles.trialNote, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
                      {t("freeTrialNote")}
                    </Text>
                    {freePremiumStatusMessage ? (
                      <Text
                        style={[
                          styles.statusBody,
                          { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
                        ]}
                      >
                        {freePremiumStatusMessage}
                      </Text>
                    ) : null}
                  </View>
                ) : purchasesSupported ? (
                  <>
                    {sortedPackages.length > 0 ? (
                      <View style={[styles.packageList, { gap: 8 * scaleSpace }]}>
                        {sortedPackages.map((pkg) => (
                          <PaywallPackageOption
                            key={pkg.identifier}
                            pkg={pkg}
                            selected={premiumPackage?.identifier === pkg.identifier}
                            recommended={isRecommendedPaywallPackage(pkg)}
                            onSelect={() => selectPackage(pkg)}
                          />
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.trialNote, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
                        {t("trialNote")}
                      </Text>
                    )}

                    <Pressable
                      accessibilityRole="button"
                      testID="paywall-purchase-cta"
                      disabled={isPending}
                      onPress={() => {
                        void HapticsService.medium();
                        void purchase();
                      }}
                      style={({ pressed }) => [
                        styles.primaryCta,
                        {
                          borderRadius: theme.radii.pill,
                          backgroundColor: theme.colors.heading,
                          paddingVertical: 14 * scaleSpace,
                          opacity: isPending ? 0.7 : 1,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      {isPending || isLoadingOffering ? (
                        <ActivityIndicator color={theme.colors.canvas} />
                      ) : (
                        <Text
                          style={[
                            styles.primaryCtaLabel,
                            { color: theme.colors.canvas, fontSize: (isTablet ? 14 : 13) * scaleFont },
                          ]}
                        >
                          {isLoadingOffering ? t("loadingOffering") : purchaseLabel}
                        </Text>
                      )}
                    </Pressable>

                    {offeringError && !isLoadingOffering ? (
                      <View style={[styles.offeringErrorBlock, { gap: 8 * scaleSpace }]}>
                        <Text
                          style={[
                            styles.statusBody,
                            { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
                          ]}
                        >
                          {t("offeringUnavailable")}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          testID="paywall-offering-retry"
                          onPress={() => {
                            void HapticsService.light();
                            void reloadOffering();
                          }}
                          style={({ pressed }) => [pressed && styles.pressed]}
                        >
                          <Text
                            style={[
                              styles.restoreLabel,
                              { color: theme.colors.accent, fontSize: 12 * scaleFont },
                            ]}
                          >
                            {t("offeringRetryCta")}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <Pressable
                      accessibilityRole="button"
                      testID="paywall-restore-cta"
                      disabled={isPending}
                      onPress={() => {
                        void HapticsService.light();
                        void restore();
                      }}
                      style={({ pressed }) => [pressed && styles.pressed]}
                    >
                      <Text style={[styles.restoreLabel, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
                        {t("restoreCta")}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={[styles.offeringErrorBlock, { gap: 10 * scaleSpace }]}>
                    <Text style={[styles.pendingBody, { color: theme.colors.textMuted, fontSize: 13 * scaleFont }]}>
                      {t("webPurchaseHint")}
                    </Text>
                    <Text style={[styles.trialNote, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
                      {t("trialNote")}
                    </Text>
                  </View>
                )}

                {!isPremium && statusMessage ? (
                  <Text
                    style={[
                      styles.statusBody,
                      {
                        color:
                          status === "success" || status === "already"
                            ? theme.colors.accent
                            : theme.colors.textMuted,
                        fontSize: 12 * scaleFont,
                      },
                    ]}
                  >
                    {statusMessage}
                  </Text>
                ) : null}
              </>
            ) : (
              <Link href="/sign-in" asChild>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    void HapticsService.medium();
                    onDismiss();
                  }}
                  style={({ pressed }) => [
                    styles.primaryCta,
                    {
                      borderRadius: theme.radii.pill,
                      backgroundColor: theme.colors.heading,
                      paddingVertical: 14 * scaleSpace,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.primaryCtaLabel, { color: theme.colors.canvas, fontSize: 15 * scaleFont }]}
                  >
                    {t("signInCta")}
                  </Text>
                </Pressable>
              </Link>
            )}

            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              testID="paywall-dismiss-cta"
            >
              <Text style={[styles.dismissLabel, { color: theme.colors.textMuted, fontSize: 10 * scaleFont }]}>
                {paymentsEnabled ? t(keys.dismissCta) : t("freeTrialDismiss")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    flexShrink: 1,
    maxHeight: "90%",
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },
  grab: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  crest: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  crestLabel: {
    fontFamily: fontFamilies.display,
    fontStyle: "italic",
    fontWeight: "700",
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  description: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  benefits: {
    width: "100%",
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkmark: {
    fontFamily: fontFamilies.mono,
    width: 14,
  },
  benefitLabel: {
    fontFamily: fontFamilies.body,
    flex: 1,
    lineHeight: 18,
  },
  packageList: {
    width: "100%",
  },
  primaryCta: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryCtaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  trialNote: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
    textAlign: "center",
  },
  restoreLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statusBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
    textAlign: "center",
  },
  pendingBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
    textAlign: "center",
  },
  offeringErrorBlock: {
    alignItems: "center",
  },
  alreadyPremiumBlock: {
    alignItems: "center",
  },
  dismissLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
  },
  pressed: {
    opacity: 0.82,
  },
});
