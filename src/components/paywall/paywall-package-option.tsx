import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useTranslation } from "react-i18next";

import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  pkg: PurchasesPackage;
  selected: boolean;
  recommended?: boolean;
  onSelect: () => void;
};

type PaywallT = ReturnType<typeof useTranslation<"paywall">>["t"];

function packageLabel(pkg: PurchasesPackage, t: PaywallT): string {
  switch (pkg.packageType) {
    case "MONTHLY":
      return t("packageMonthly");
    case "ANNUAL":
      return t("packageAnnual");
    case "LIFETIME":
      return t("packageLifetime");
    default:
      return pkg.product.title || pkg.identifier;
  }
}

function trialLabel(pkg: PurchasesPackage, t: PaywallT): string | null {
  const intro = pkg.product.introPrice;
  if (!intro) return null;
  if (intro.price === 0) {
    return t("packageTrialFree");
  }
  return t("packageTrialIntro", { price: intro.priceString });
}

export function PaywallPackageOption({ pkg, selected, recommended = false, onSelect }: Props) {
  const { t } = useTranslation("paywall");
  const { theme } = useAppTheme();
  const trial = trialLabel(pkg, t);

  return (
    <Pressable
      accessibilityRole="button"
      testID={`paywall-package-${pkg.identifier}`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        {
          borderRadius: theme.radii.lg,
          borderColor: selected ? theme.colors.premium : theme.colors.border,
          backgroundColor: selected
            ? withAlpha(theme.colors.premium, theme.isDark ? 0.18 : 0.1)
            : theme.colors.surface,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.copy}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.heading }]}>{packageLabel(pkg, t)}</Text>
          {recommended ? (
            <View
              style={[
                styles.badge,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: withAlpha(theme.colors.premium, theme.isDark ? 0.22 : 0.14),
                },
              ]}
            >
              <Text style={[styles.badgeLabel, { color: theme.colors.premium }]}>
                {t("packageBestValue")}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.price, { color: theme.colors.premium }]}>{pkg.product.priceString}</Text>
        {trial ? (
          <Text style={[styles.trial, { color: theme.colors.textMuted }]}>{trial}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.colors.premium : theme.colors.border,
            backgroundColor: selected ? theme.colors.premium : "transparent",
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  price: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  trial: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
});
