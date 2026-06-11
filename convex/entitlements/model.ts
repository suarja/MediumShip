// Pure entitlement decision seam — no Convex ctx, so it is unit-testable and
// shared by the read query, the `requireMember` guard, and the CMS user list.
// Keep all "is this user a member?" logic flowing through here so the rule has
// exactly one definition regardless of which provider wrote the row.

export type EntitlementSource = "manual" | "revenuecat" | "stripe" | "trial";

export type EntitlementRecord = {
  isPro: boolean;
  source: EntitlementSource;
} | null;

// A user is a member iff an entitlement row exists and `isPro` is true. A
// missing row (guest, or never granted) and an explicitly revoked row both
// resolve to false.
export function isProFromEntitlement(record: EntitlementRecord): boolean {
  return record?.isPro === true;
}
