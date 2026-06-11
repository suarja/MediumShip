import { renderHook, act, waitFor } from "@testing-library/react-native";

import {
  loadPremiumOfferingForUser,
  purchasePremiumPackage,
  restorePurchases,
} from "../src/features/billing/purchases";
import { usePurchasePremium } from "../src/features/billing/use-purchase-premium";

jest.mock("convex/react", () => ({
  useAction: () => jest.fn().mockResolvedValue({ synced: true, isPro: true }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isSignedIn: true,
    userId: "user_test_123",
  }),
}));

jest.mock("../src/features/billing/purchases", () => ({
  isPurchasesSupported: () => true,
  getPurchasesDiagnostics: () => ({
    platform: "ios",
    purchasesSupported: true,
    apiKeySource: "test_store",
    configuredForClerkId: null,
  }),
  loadPremiumOfferingForUser: jest.fn(),
  selectPremiumPackage: (offering: { monthly: unknown } | null) => offering?.monthly ?? null,
  purchasePremiumPackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

const mockLoadPremiumOfferingForUser = loadPremiumOfferingForUser as jest.MockedFunction<
  typeof loadPremiumOfferingForUser
>;
const mockPurchasePremiumPackage = purchasePremiumPackage as jest.MockedFunction<
  typeof purchasePremiumPackage
>;
const mockRestorePurchases = restorePurchases as jest.MockedFunction<typeof restorePurchases>;

const mockPackage = {
  identifier: "monthly",
  packageType: "MONTHLY",
  product: { priceString: "€2.00" },
} as never;

describe("usePurchasePremium", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPremiumOfferingForUser.mockResolvedValue({
      offering: { identifier: "default", availablePackages: [mockPackage] } as never,
      package: mockPackage,
    });
    mockPurchasePremiumPackage.mockResolvedValue({ kind: "success", customerInfo: {} as never });
    mockRestorePurchases.mockResolvedValue({ kind: "success", customerInfo: {} as never });
  });

  it("loads offering for the signed-in clerk user", async () => {
    const { result } = renderHook(() => usePurchasePremium({ enabled: true }));

    await waitFor(() => expect(result.current.package).not.toBeNull());
    expect(mockLoadPremiumOfferingForUser).toHaveBeenCalledWith("user_test_123");
  });

  it("sets success after purchase", async () => {
    const { result } = renderHook(() => usePurchasePremium({ enabled: true }));
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.purchase();
    });

    expect(result.current.status).toBe("success");
  });

  it("sets cancelled when purchase is cancelled", async () => {
    mockPurchasePremiumPackage.mockResolvedValueOnce({ kind: "cancelled" });
    const { result } = renderHook(() => usePurchasePremium({ enabled: true }));
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.purchase();
    });

    expect(result.current.status).toBe("cancelled");
  });

  it("sets error when purchase fails", async () => {
    mockPurchasePremiumPackage.mockResolvedValueOnce({
      kind: "error",
      message: "Network error",
    });
    const { result } = renderHook(() => usePurchasePremium({ enabled: true }));
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.purchase();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("Network error");
  });

  it("sets success after restore finds premium", async () => {
    const { result } = renderHook(() => usePurchasePremium({ enabled: true }));
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.restore();
    });

    expect(result.current.status).toBe("success");
  });

  it("skips loading when disabled", async () => {
    renderHook(() => usePurchasePremium({ enabled: false }));
    await waitFor(() => expect(mockLoadPremiumOfferingForUser).not.toHaveBeenCalled());
  });
});
