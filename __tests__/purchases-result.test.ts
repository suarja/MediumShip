/**
 * Unit tests for purchases.ts result mapping.
 * Verifies that purchasePremiumPackage always returns {kind:"success"} when
 * Purchases.purchasePackage resolves — regardless of client-side entitlement state.
 */
import { PURCHASES_ERROR_CODE } from "react-native-purchases";

import { purchasePremiumPackage } from "../src/features/billing/purchases";

// Minimal CustomerInfo stub
const stubCustomerInfo = {
  entitlements: { active: {} },
} as never;

// Mock the entire react-native-purchases module
jest.mock("react-native-purchases", () => {
  const PURCHASES_ERROR_CODE = {
    PURCHASE_CANCELLED_ERROR: "1",
    PRODUCT_ALREADY_PURCHASED_ERROR: "6",
  };
  return {
    __esModule: true,
    default: {
      purchasePackage: jest.fn(),
    },
    PURCHASES_ERROR_CODE,
    LOG_LEVEL: { DEBUG: "DEBUG" },
  };
});

// Minimal platform mock for isPurchasesSupported()
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Env mock so isPurchasesSupported() returns true
jest.mock("../src/lib/env", () => ({
  env: {
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: "test-key",
  },
}));

jest.mock("../src/features/billing/billing-debug", () => ({
  logBilling: jest.fn(),
  maskRevenueCatKey: (k: string) => k,
}));

jest.mock("../src/features/billing/premium-entitlement", () => ({
  getPremiumEntitlementId: () => "premium",
  hasPremiumEntitlement: jest.fn(() => false), // returns false to simulate identifier mismatch
}));

import Purchases from "react-native-purchases";

const mockPurchasePackage = Purchases.purchasePackage as jest.MockedFunction<
  typeof Purchases.purchasePackage
>;

const mockPackage = {
  identifier: "monthly",
  packageType: "MONTHLY",
  product: { identifier: "com.test.monthly", priceString: "€2.00" },
} as never;

describe("purchasePremiumPackage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns {kind:'success'} when purchasePackage resolves, even if client entitlement doesn't match", async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: stubCustomerInfo,
    } as never);

    const result = await purchasePremiumPackage(mockPackage);

    expect(result.kind).toBe("success");
  });

  it("returns {kind:'cancelled'} when RC throws PURCHASE_CANCELLED_ERROR", async () => {
    const err = Object.assign(new Error("cancelled"), {
      code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
    });
    mockPurchasePackage.mockRejectedValueOnce(err);

    const result = await purchasePremiumPackage(mockPackage);

    expect(result.kind).toBe("cancelled");
  });

  it("returns {kind:'already'} when RC throws PRODUCT_ALREADY_PURCHASED_ERROR", async () => {
    const err = Object.assign(new Error("already purchased"), {
      code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR,
    });
    mockPurchasePackage.mockRejectedValueOnce(err);

    const result = await purchasePremiumPackage(mockPackage);

    expect(result.kind).toBe("already");
  });

  it("returns {kind:'error'} for any other RC error", async () => {
    const err = new Error("network failure");
    mockPurchasePackage.mockRejectedValueOnce(err);

    const result = await purchasePremiumPackage(mockPackage);

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toMatch(/network failure/i);
    }
  });
});
