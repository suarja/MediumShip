import type { CustomerInfo } from "react-native-purchases";

import {
  getPremiumEntitlementId,
  hasPremiumEntitlement,
} from "../src/features/billing/premium-entitlement";

describe("premium-entitlement", () => {
  it("defaults to the neutral 'premium' id (real id comes from env)", () => {
    expect(getPremiumEntitlementId()).toBe("premium");
  });

  it("detects the active entitlement matching the configured id", () => {
    const id = getPremiumEntitlementId();
    const customerInfo = {
      entitlements: {
        active: {
          [id]: { identifier: id },
        },
      },
    } as unknown as CustomerInfo;

    expect(hasPremiumEntitlement(customerInfo)).toBe(true);
  });
});
