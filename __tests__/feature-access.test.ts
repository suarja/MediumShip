import {
  canAccessFeatureLevel,
  isFeatureNavVisible,
  PREMIUM_PAYMENT_DEFERRED,
} from "../src/features/tenant/feature-access";

describe("feature-access", () => {
  it("treats free access as open to everyone", () => {
    expect(
      canAccessFeatureLevel("free", { isAuthenticated: false, isPro: false }),
    ).toBe(true);
  });

  it("requires authentication — not premium — for member access", () => {
    expect(
      canAccessFeatureLevel("member", { isAuthenticated: false, isPro: false }),
    ).toBe(false);
    // A signed-in free user (not pro) passes a member-gated feature.
    expect(
      canAccessFeatureLevel("member", { isAuthenticated: true, isPro: false }),
    ).toBe(true);
  });

  it("gates premium access on isPro (real entitlement gating active)", () => {
    expect(PREMIUM_PAYMENT_DEFERRED).toBe(false);

    // Non-pro users (guests and plain members) are blocked.
    expect(
      canAccessFeatureLevel("premium", { isAuthenticated: false, isPro: false }),
    ).toBe(false);
    expect(
      canAccessFeatureLevel("premium", { isAuthenticated: true, isPro: false }),
    ).toBe(false);

    // Pro subscribers have access.
    expect(
      canAccessFeatureLevel("premium", { isAuthenticated: true, isPro: true }),
    ).toBe(true);
  });

  it("hides disabled features from navigation", () => {
    expect(isFeatureNavVisible(false)).toBe(false);
    expect(isFeatureNavVisible(true)).toBe(true);
  });
});
