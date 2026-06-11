import type { PurchasesPackage } from "react-native-purchases";

import {
  formatPaywallPurchaseLabel,
  isRecommendedPaywallPackage,
  sortPaywallPackages,
} from "../src/features/paywall/paywall-purchase-label";

const annual = {
  identifier: "$rc_annual",
  packageType: "ANNUAL",
  product: { priceString: "€59.00", identifier: "annual" },
} as unknown as PurchasesPackage;

const monthly = {
  identifier: "$rc_monthly",
  packageType: "MONTHLY",
  product: { priceString: "€2.00", identifier: "monthly" },
} as unknown as PurchasesPackage;

describe("paywall-purchase-label", () => {
  const t = (key: string, options?: { price: string }) => {
    if (key === "purchaseCtaWithPrice" && options) {
      return `Become a member · ${options.price}`;
    }
    return "Become a member";
  };

  it("formats CTA with selected package price", () => {
    expect(formatPaywallPurchaseLabel(t, annual)).toBe("Become a member · €59.00");
  });

  it("sorts annual before monthly", () => {
    expect(sortPaywallPackages([monthly, annual]).map((pkg) => pkg.packageType)).toEqual([
      "ANNUAL",
      "MONTHLY",
    ]);
  });

  it("marks annual as recommended", () => {
    expect(isRecommendedPaywallPackage(annual)).toBe(true);
    expect(isRecommendedPaywallPackage(monthly)).toBe(false);
  });
});
