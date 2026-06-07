import { renderHook, act } from "@testing-library/react-native";

import { useCategoryInterests } from "../src/features/categories/use-category-interests";

const mockSetCategoryInterests = jest.fn().mockResolvedValue(undefined);
const mockRequestDiscoveryFeedRefresh = jest.fn();

let mockIsSignedIn = true;

jest.mock("convex/react", () => ({
  useMutation: () => mockSetCategoryInterests,
  useQuery: jest.fn(),
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

  it("persists toggles and reloads the discovery feed", async () => {
    const { result } = renderHook(() => useCategoryInterests());

    await act(async () => {
      await result.current.toggleCategory("Philosophie");
    });

    expect(mockSetCategoryInterests).toHaveBeenCalledWith({
      tenantSlug: "demo-media",
      categoryKeys: ["Philosophie", "Science"],
    });
    expect(mockRequestDiscoveryFeedRefresh).toHaveBeenCalled();
  });

  it("skips writes for guests", async () => {
    mockIsSignedIn = false;

    const { result } = renderHook(() => useCategoryInterests());

    await act(async () => {
      await result.current.toggleCategory("Science");
    });

    expect(mockSetCategoryInterests).not.toHaveBeenCalled();
    expect(mockRequestDiscoveryFeedRefresh).not.toHaveBeenCalled();
  });
});
