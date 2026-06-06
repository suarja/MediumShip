import { act, renderHook } from "@testing-library/react-native";

import {
  discoveryFeedItemKey,
  useDiscoveryFeed,
  type DiscoveryFeedItem,
} from "../src/features/discovery/use-discovery-feed";

// Captures the `cursor` arg passed to every getDiscoveryFeed call so we can
// assert the hook never resets the cursor back to page 0 after exhaustion —
// the bug that caused an infinite getDiscoveryFeed loop (runaway Convex cost).
const mockFeedCursorCalls: Array<string | null | undefined> = [];
let mockFeedReturn: unknown;

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn().mockResolvedValue(undefined),
  useQuery: (_fn: unknown, args: unknown) => {
    if (args === "skip") {
      return undefined;
    }
    if (args && typeof args === "object" && "tenantSlug" in (args as Record<string, unknown>)) {
      mockFeedCursorCalls.push((args as { cursor?: string | null }).cursor);
      return mockFeedReturn;
    }
    // getMe
    return { tokenIdentifier: "token_member" };
  },
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({ tenantSlug: "demo-media" }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

function makePage(args: {
  items: string[];
  nextCursor: string | null;
  recycling: boolean;
}) {
  return {
    items: args.items.map((id) => ({
      _id: id,
      tenantSlug: "demo-media",
      kind: "article",
      status: "published",
      title: id,
      summary: "",
      category: "A",
      tags: [],
      isPremium: false,
      reason: "editorial",
      isLiked: false,
    })) as DiscoveryFeedItem[],
    nextCursor: args.nextCursor,
    recycling: args.recycling,
  };
}

describe("discoveryFeedItemKey", () => {
  it("uses position-composite keys so recycled repeats stay unique", () => {
    const item = makePage({ items: ["a"], nextCursor: null, recycling: false })
      .items[0]!;

    expect(discoveryFeedItemKey(item, 0)).toBe("0-a");
    expect(discoveryFeedItemKey(item, 3)).toBe("3-a");
  });
});

describe("useDiscoveryFeed — no infinite pagination loop", () => {
  beforeEach(() => {
    mockFeedCursorCalls.length = 0;
  });

  it("does not reset the query cursor to page 0 after a recycling page", () => {
    mockFeedReturn = makePage({ items: ["a", "b"], nextCursor: "2", recycling: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    act(() => {
      result.current.loadMore();
    });

    mockFeedReturn = makePage({ items: ["c"], nextCursor: "3", recycling: true });
    rerender({});

    const callsBeforeEndRetry = mockFeedCursorCalls.length;

    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.isRecycling).toBe(true);

    const cursorsAfterRecycling = mockFeedCursorCalls.slice(callsBeforeEndRetry);
    expect(cursorsAfterRecycling).not.toContain(null);
    expect(cursorsAfterRecycling).not.toContain(undefined);
  });

  it("keeps loadMore working while the server returns a nextCursor", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: "1", recycling: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", recycling: true });
    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.hasMoreLocal).toBe(true);
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);

    mockFeedReturn = makePage({ items: ["a"], nextCursor: "3", recycling: true });
    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b", "a"]);
  });

  it("does not re-append the current page when the reactive query re-runs (refill)", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: "1", recycling: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", recycling: false });
    act(() => {
      result.current.loadMore();
    });
    rerender({});
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);

    // Corpus grew via refill → the query re-runs at the SAME cursor (no
    // loadMore). The page must not be re-appended (the duplicate-within-a-few-
    // items bug). A new object reference triggers the reactive effect.
    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", recycling: false });
    rerender({});
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);
  });

  it("loadMore is a no-op once nextCursor is null", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: null, recycling: false });
    const { result } = renderHook(() => useDiscoveryFeed());

    const callsBefore = mockFeedCursorCalls.length;
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(mockFeedCursorCalls.length).toBe(callsBefore);
  });
});
