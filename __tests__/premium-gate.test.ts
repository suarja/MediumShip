import { isProFromEntitlement } from "../convex/entitlements/model";
import { resolvePremiumGate } from "../src/features/membership/premium-gate";

describe("resolvePremiumGate", () => {
  it("opens free content for everyone", () => {
    expect(resolvePremiumGate({ isPremium: false, isMember: false })).toBe(
      "open",
    );
    expect(resolvePremiumGate({ isPremium: false, isMember: true })).toBe(
      "open",
    );
  });

  it("locks premium content for non-members (incl. guests)", () => {
    expect(resolvePremiumGate({ isPremium: true, isMember: false })).toBe(
      "locked",
    );
  });

  it("opens premium content for members", () => {
    expect(resolvePremiumGate({ isPremium: true, isMember: true })).toBe(
      "open",
    );
  });
});

describe("isProFromEntitlement", () => {
  it("treats a missing row (guest / never granted) as not a member", () => {
    expect(isProFromEntitlement(null)).toBe(false);
  });

  it("treats an explicitly revoked row as not a member", () => {
    expect(isProFromEntitlement({ isPro: false, source: "manual" })).toBe(false);
  });

  it("recognises an active entitlement regardless of source", () => {
    expect(isProFromEntitlement({ isPro: true, source: "manual" })).toBe(true);
    expect(isProFromEntitlement({ isPro: true, source: "revenuecat" })).toBe(
      true,
    );
    expect(isProFromEntitlement({ isPro: true, source: "stripe" })).toBe(true);
  });
});
