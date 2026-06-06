import { renderHook } from "@testing-library/react-native";

import { useBookmarks } from "../src/features/bookmarks/use-bookmarks";

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn(),
  useQuery: () => [],
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

describe("useBookmarks", () => {
  it("allows a signed-in standard account to access bookmarks", () => {
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.isMember).toBe(false);
    expect(result.current.canAccessBookmarks).toBe(true);
  });
});
