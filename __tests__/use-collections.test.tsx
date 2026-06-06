import { useCollections, useCollection } from "../src/features/collections/use-collections";
import { renderHook } from "@testing-library/react-native";

jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    tenantSlug: "demo-media",
    theme: {
      colors: {},
      spacing: {},
      radii: {},
      isDark: false,
    },
    enabledModules: [],
    feedSections: [],
  }),
}));

const { useQuery } = jest.requireMock("convex/react") as { useQuery: jest.Mock };

describe("useCollections", () => {
  beforeEach(() => {
    useQuery.mockReset();
  });

  it("isLoading is true while the query is loading (undefined)", () => {
    useQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useCollections());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.collections).toEqual([]);
  });

  it("isLoading is false and collections are returned once resolved", () => {
    const mockCollections = [
      { _id: "coll_1", slug: "test", title: "Test Collection", summary: "S", itemCount: 3 },
    ];
    useQuery.mockReturnValue(mockCollections);
    const { result } = renderHook(() => useCollections());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.collections).toEqual(mockCollections);
  });

  it("passes tenantSlug to the query", () => {
    useQuery.mockReturnValue([]);
    renderHook(() => useCollections());
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantSlug: "demo-media" }),
    );
  });
});

describe("useCollection", () => {
  beforeEach(() => {
    useQuery.mockReset();
  });

  it("isLoading is true while loading", () => {
    useQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useCollection("coll_123"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.collection).toBeUndefined();
  });

  it("returns collection detail when resolved", () => {
    const mockDetail = {
      _id: "coll_123",
      slug: "test",
      title: "Test",
      summary: "S",
      itemCount: 1,
      items: [{ contentId: "c1", title: "Article", kind: "article", category: "X", isPremium: false }],
    };
    useQuery.mockReturnValue(mockDetail);
    const { result } = renderHook(() => useCollection("coll_123"));
    expect(result.current.collection).toEqual(mockDetail);
    expect(result.current.isLoading).toBe(false);
  });

  it("skips the query when id is empty", () => {
    useQuery.mockReturnValue(undefined);
    renderHook(() => useCollection(""));
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });
});
