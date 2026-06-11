import {
  resolveAccessBadge,
  resolveContentAccessBadge,
} from "../src/features/tenant/access-badge";
import * as featureAccess from "../src/features/tenant/feature-access";

describe("resolveAccessBadge", () => {
  describe("free access", () => {
    it.each([
      { isAuthenticated: false, isPro: false },
      { isAuthenticated: true, isPro: false },
      { isAuthenticated: true, isPro: true },
    ])("never shows a badge (%p)", ({ isAuthenticated, isPro }) => {
      expect(
        resolveAccessBadge({ access: "free", isAuthenticated, isPro }),
      ).toEqual({ show: false });
    });
  });

  describe("member access", () => {
    it("shows a member badge for guests", () => {
      expect(
        resolveAccessBadge({
          access: "member",
          isAuthenticated: false,
          isPro: false,
        }),
      ).toEqual({ show: true, level: "member" });
    });

    it("hides the badge once signed in", () => {
      expect(
        resolveAccessBadge({
          access: "member",
          isAuthenticated: true,
          isPro: false,
        }),
      ).toEqual({ show: false });
    });

    it("hides the badge for premium members", () => {
      expect(
        resolveAccessBadge({
          access: "member",
          isAuthenticated: true,
          isPro: true,
        }),
      ).toEqual({ show: false });
    });
  });

  describe("premium access with real entitlement gating (PREMIUM_PAYMENT_DEFERRED=false)", () => {
    it("confirms real gating is active", () => {
      expect(featureAccess.PREMIUM_PAYMENT_DEFERRED).toBe(false);
    });

    it("shows a premium badge for guests (not pro)", () => {
      expect(
        resolveAccessBadge({
          access: "premium",
          isAuthenticated: false,
          isPro: false,
        }),
      ).toEqual({ show: true, level: "premium" });
    });

    it("shows a premium badge for signed-in members without pro entitlement", () => {
      expect(
        resolveAccessBadge({
          access: "premium",
          isAuthenticated: true,
          isPro: false,
        }),
      ).toEqual({ show: true, level: "premium" });
    });

    it("hides the badge for pro subscribers", () => {
      expect(
        resolveAccessBadge({
          access: "premium",
          isAuthenticated: true,
          isPro: true,
        }),
      ).toEqual({ show: false });
    });
  });
});

describe("resolveContentAccessBadge", () => {
  it("maps non-premium content to no badge", () => {
    expect(
      resolveContentAccessBadge({
        isPremium: false,
        isAuthenticated: false,
        isPro: false,
      }),
    ).toEqual({ show: false });
  });

  it("delegates premium content to resolveAccessBadge", () => {
    expect(
      resolveContentAccessBadge({
        isPremium: true,
        isAuthenticated: false,
        isPro: false,
      }),
    ).toEqual(resolveAccessBadge({ access: "premium", isAuthenticated: false, isPro: false }));
  });
});
