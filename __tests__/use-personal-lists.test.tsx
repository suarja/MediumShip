import { renderHook } from "@testing-library/react-native";

import { usePersonalLists } from "../src/features/personal-lists/use-personal-lists";

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn(),
  useQuery: () => [],
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

describe("usePersonalLists", () => {
  it("exposes empty lists and free-tier create allowance", () => {
    const { result } = renderHook(() => usePersonalLists());

    expect(result.current.lists).toEqual([]);
    expect(result.current.primaryList).toBeNull();
    expect(result.current.isAtFreeLimit).toBe(false);
    expect(result.current.canCreateAnother).toBe(true);
  });
});
