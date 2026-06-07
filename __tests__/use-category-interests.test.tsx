import { renderHook, act } from "@testing-library/react-native";

import { useCategoryInterests } from "../src/features/categories/use-category-interests";

const mockSetCategoryInterests = jest.fn().mockResolvedValue(undefined);
const mockRequestDiscoveryFeedRefresh = jest.fn();

let mockIsSignedIn = true;
let mockIsAuthenticated = true;
let mockIsConvexAuthLoading = false;

jest.mock("convex/react", () => ({
  useMutation: () => mockSetCategoryInterests,
  useQuery: jest.fn(),
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsConvexAuthLoading,
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: mockIsSignedIn }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({ tenantSlug: "demo-media" }),
}));

jest.mock("../src/features/discovery/discovery-feed-refresh", () => ({
  requestDiscoveryFeedRefresh: () => mockRequestDiscoveryFeedRefresh(),
}));

const { useQuery } = jest.requireMock("convex/react") as {
  useQuery: jest.Mock;
};

describe("useCategoryInterests", () => {
  beforeEach(() => {
    mockSetCategoryInterests.mockClear();
    mockRequestDiscoveryFeedRefresh.mockClear();
    mockIsSignedIn = true;
    mockIsAuthenticated = true;
    mockIsConvexAuthLoading = false;

    useQuery.mockImplementation((_ref: unknown, args: unknown) => {
      if (args === "skip") {
        return undefined;
      }

      const activeCalls = useQuery.mock.calls.filter(
        (call) => call[1] !== "skip",
      ).length;

      if (activeCalls === 1) {
        return [
          { label: "Science", icon: "⨁", iconKey: "science" },
          { label: "Philosophie", icon: "◉", iconKey: "default" },
        ];
      }

      return ["science"];
    });
  });

  it("persists an explicit key set when Convex auth is ready", async () => {
    const { result } = renderHook(() => useCategoryInterests());

    await act(async () => {
      await result.current.applyCategoryInterests(new Set(["science", "philosophie"]));
    });

    expect(mockSetCategoryInterests).toHaveBeenCalledWith({
      tenantSlug: "demo-media",
      categoryKeys: ["philosophie", "science"],
    });
    expect(mockRequestDiscoveryFeedRefresh).toHaveBeenCalled();
  });

  it("throws when Convex auth is not ready", async () => {
    mockIsAuthenticated = false;

    const { result } = renderHook(() => useCategoryInterests());

    await expect(
      result.current.applyCategoryInterests(new Set(["science"])),
    ).rejects.toThrow("authenticated Convex session");
    expect(mockSetCategoryInterests).not.toHaveBeenCalled();
  });

  it("skips the interests query until Convex auth is ready", () => {
    mockIsAuthenticated = false;

    renderHook(() => useCategoryInterests());

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      "skip",
    );
  });
});
