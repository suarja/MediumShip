import type { PurchasesPackage } from "react-native-purchases";

type TranslatePaywall = (
  key: "purchaseCtaWithPrice" | "purchaseCtaFallback",
  options?: { price: string },
) => string;

/** Primary CTA copy — mockup: « Devenir membre · 59 € / an » from the selected package. */
export function formatPaywallPurchaseLabel(
  t: TranslatePaywall,
  pkg: PurchasesPackage | null,
): string {
  if (!pkg?.product.priceString) {
    return t("purchaseCtaFallback");
  }

  return t("purchaseCtaWithPrice", { price: pkg.product.priceString });
}

const PACKAGE_SORT_ORDER: Record<string, number> = {
  ANNUAL: 0,
  MONTHLY: 1,
  LIFETIME: 2,
};

export function sortPaywallPackages(packages: PurchasesPackage[]): PurchasesPackage[] {
  return [...packages].sort((left, right) => {
    const leftOrder = PACKAGE_SORT_ORDER[left.packageType] ?? 9;
    const rightOrder = PACKAGE_SORT_ORDER[right.packageType] ?? 9;
    return leftOrder - rightOrder;
  });
}

export function isRecommendedPaywallPackage(pkg: PurchasesPackage): boolean {
  return pkg.packageType === "ANNUAL";
}
