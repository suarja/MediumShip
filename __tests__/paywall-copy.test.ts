import { resolvePaywallCopyKeys } from "../src/features/paywall/paywall-copy";

describe("resolvePaywallCopyKeys", () => {
  it("returns keys for each known reason", () => {
    const reasons = ["content", "offline", "lists", "members", "support"] as const;
    for (const reason of reasons) {
      const keys = resolvePaywallCopyKeys(reason);
      expect(keys.eyebrow).toBe(`reasons.${reason}.eyebrow`);
      expect(keys.title).toBe(`reasons.${reason}.title`);
      expect(keys.description).toBe(`reasons.${reason}.description`);
    }
  });

  it("falls back to support for unknown reason", () => {
    const keys = resolvePaywallCopyKeys("unknown_reason");
    expect(keys.eyebrow).toBe("reasons.support.eyebrow");
    expect(keys.title).toBe("reasons.support.title");
    expect(keys.description).toBe("reasons.support.description");
  });

  it("falls back to support for null", () => {
    const keys = resolvePaywallCopyKeys(null);
    expect(keys.eyebrow).toBe("reasons.support.eyebrow");
  });

  it("falls back to support for undefined", () => {
    const keys = resolvePaywallCopyKeys(undefined);
    expect(keys.eyebrow).toBe("reasons.support.eyebrow");
  });
});
