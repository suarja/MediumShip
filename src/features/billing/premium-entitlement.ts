import type { CustomerInfo } from "react-native-purchases";

import { env } from "../../lib/env";

// RevenueCat entitlement IDENTIFIER (not display name). White-label: set the real
// id per app via EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID. Neutral default ("premium"),
// never a tenant-specific brand value.
export function getPremiumEntitlementId(): string {
  return env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";
}

export function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  const id = getPremiumEntitlementId();
  return customerInfo.entitlements.active[id] !== undefined;
}
