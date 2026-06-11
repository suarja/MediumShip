declare const process: { env: Record<string, string | undefined> };

// RevenueCat entitlement IDENTIFIER (not display name). White-label: set the
// real id per deployment via `npx convex env set REVENUECAT_ENTITLEMENT_ID <id>`.
// The default stays neutral ("premium") — never a tenant-specific brand value.
export function getPremiumEntitlementId(): string {
  return process.env.REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";
}
