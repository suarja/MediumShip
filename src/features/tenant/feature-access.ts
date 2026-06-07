import type { AccessLevel } from "../../../convex/featureCatalog";

export type FeatureAccessContext = {
  isAuthenticated: boolean;
  isPro: boolean;
};

/** Payment is deferred: premium-gated features pass until a provider writes entitlements. */
export const PREMIUM_PAYMENT_DEFERRED = true;

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
