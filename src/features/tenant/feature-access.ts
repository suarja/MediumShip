import type { AccessLevel } from "../../../convex/featureCatalog";

export type FeatureAccessContext = {
  isAuthenticated: boolean;
  isPro: boolean;
};

/**
 * Kill-switch for launch: false = real entitlement gating active (isPro required for premium);
 * true = premium open for everyone (demo / pre-payment-provider mode).
 */
export const PREMIUM_PAYMENT_DEFERRED = false;

export function canAccessFeatureLevel(
  access: AccessLevel,
  context: FeatureAccessContext,
): boolean {
  if (access === "free") {
    return true;
  }

  if (access === "member") {
    return context.isAuthenticated;
  }

  if (PREMIUM_PAYMENT_DEFERRED) {
    return true;
  }

  return context.isPro;
}

export function isFeatureNavVisible(enabled: boolean): boolean {
  return enabled;
}
