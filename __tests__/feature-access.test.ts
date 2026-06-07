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

  it("requires member entitlement for member access", () => {
    expect(
      canAccessFeatureLevel("member", { isAuthenticated: false, isPro: false }),
    ).toBe(false);
    expect(
      canAccessFeatureLevel("member", { isAuthenticated: true, isPro: true }),
    ).toBe(true);
  });

  it("lets premium access pass while payment is deferred", () => {
    expect(PREMIUM_PAYMENT_DEFERRED).toBe(true);
    expect(
      canAccessFeatureLevel("premium", { isAuthenticated: false, isPro: false }),
    ).toBe(true);
  });

  it("hides disabled features from navigation", () => {
    expect(isFeatureNavVisible(false)).toBe(false);
    expect(isFeatureNavVisible(true)).toBe(true);
  });
});
