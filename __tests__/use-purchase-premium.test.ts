import { renderHook, act, waitFor } from "@testing-library/react-native";

import {
  getPremiumOffering,
  purchasePremiumPackage,
  restorePurchases,
} from "../src/features/billing/purchases";
import { usePurchasePremium } from "../src/features/billing/use-purchase-premium";

jest.mock("../src/features/billing/purchases", () => ({
  isPurchasesSupported: () => true,
  getPremiumOffering: jest.fn(),
  selectPremiumPackage: (offering: { monthly: { identifier: string } } | null) =>
    offering?.monthly ?? null,
  purchasePremiumPackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

const mockGetPremiumOffering = getPremiumOffering as jest.MockedFunction<
  typeof getPremiumOffering
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
    mockGetPremiumOffering.mockResolvedValue({
      identifier: "default",
      monthly: mockPackage,
      availablePackages: [mockPackage],
    } as never);
    mockPurchasePremiumPackage.mockResolvedValue({ kind: "success", customerInfo: {} as never });
    mockRestorePurchases.mockResolvedValue({ kind: "success", customerInfo: {} as never });
  });

  it("loads offering on mount", async () => {
    const { result } = renderHook(() => usePurchasePremium());

    await waitFor(() => expect(result.current.package).not.toBeNull());
    expect(mockGetPremiumOffering).toHaveBeenCalled();
  });

  it("sets success after purchase", async () => {
    const { result } = renderHook(() => usePurchasePremium());
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.purchase();
    });

    expect(result.current.status).toBe("success");
  });

  it("sets cancelled when purchase is cancelled", async () => {
    mockPurchasePremiumPackage.mockResolvedValueOnce({ kind: "cancelled" });
    const { result } = renderHook(() => usePurchasePremium());
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
    const { result } = renderHook(() => usePurchasePremium());
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.purchase();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("Network error");
  });

  it("sets success after restore finds premium", async () => {
    const { result } = renderHook(() => usePurchasePremium());
    await waitFor(() => expect(result.current.package).not.toBeNull());

    await act(async () => {
      await result.current.restore();
    });

    expect(result.current.status).toBe("success");
  });
});
