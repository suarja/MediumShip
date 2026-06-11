import { render, waitFor } from "@testing-library/react-native";

import { GuestInterestsSync } from "../src/features/categories/use-guest-interests-sync";

const mockSetCategoryInterests = jest.fn().mockResolvedValue(undefined);
let mockIsAuthenticated = true;
let mockServerKeys: unknown = [];

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: mockIsAuthenticated, isLoading: false }),
  useQuery: () => mockServerKeys,
  useMutation: () => mockSetCategoryInterests,
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({ tenantSlug: "demo-media" }),
}));

const mockGetGuest = jest.fn();
const mockClearGuest = jest.fn().mockResolvedValue(undefined);
jest.mock("../src/features/categories/guest-category-interests", () => ({
  getGuestCategoryInterests: () => mockGetGuest(),
  clearGuestCategoryInterests: () => mockClearGuest(),
}));

describe("GuestInterestsSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockServerKeys = ["science"];
  });

  it("merges guest keys into server interests and clears local on sign-in", async () => {
    mockGetGuest.mockResolvedValue(["economy"]);

    render(<GuestInterestsSync />);

    await waitFor(() => expect(mockSetCategoryInterests).toHaveBeenCalledTimes(1));
    expect(mockSetCategoryInterests).toHaveBeenCalledWith({
      tenantSlug: "demo-media",
      categoryKeys: ["science", "economy"],
    });
    await waitFor(() => expect(mockClearGuest).toHaveBeenCalledTimes(1));
  });

  it("does nothing when there are no pending guest keys", async () => {
    mockGetGuest.mockResolvedValue([]);

    render(<GuestInterestsSync />);

    await waitFor(() => expect(mockGetGuest).toHaveBeenCalled());
    expect(mockSetCategoryInterests).not.toHaveBeenCalled();
    expect(mockClearGuest).not.toHaveBeenCalled();
  });

  it("does not sync while unauthenticated", async () => {
    mockIsAuthenticated = false;
    mockGetGuest.mockResolvedValue(["economy"]);

    render(<GuestInterestsSync />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockGetGuest).not.toHaveBeenCalled();
    expect(mockSetCategoryInterests).not.toHaveBeenCalled();
  });
});
