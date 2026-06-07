import { act, renderHook } from "@testing-library/react-native";

import {
  discoveryFeedItemKey,
  mergeDiscoveryFeedItems,
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
  seekingFresh: boolean;
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
    seekingFresh: args.seekingFresh,
  };
}

describe("discoveryFeedItemKey", () => {
  it("uses stable content ids now that recycled repeats are gone", () => {
    const item = makePage({ items: ["a"], nextCursor: null, seekingFresh: false })
      .items[0]!;

    expect(discoveryFeedItemKey(item)).toBe("a");
  });
});

describe("mergeDiscoveryFeedItems", () => {
  it("shows each _id at most once per session", () => {
    const first = makePage({ items: ["a", "b"], nextCursor: "2", seekingFresh: false })
      .items;
    const second = makePage({ items: ["b", "c", "a"], nextCursor: "3", seekingFresh: false })
      .items;

    const merged = mergeDiscoveryFeedItems(
      mergeDiscoveryFeedItems([], first, true),
      second,
      false,
    );

    expect(merged.map((item) => item._id)).toEqual(["a", "b", "c"]);
  });
});

describe("useDiscoveryFeed — no infinite pagination loop", () => {
  beforeEach(() => {
    mockFeedCursorCalls.length = 0;
  });

  it("does not reset the query cursor to page 0 after exhaustion", () => {
    mockFeedReturn = makePage({ items: ["a", "b"], nextCursor: "2", seekingFresh: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    act(() => {
      result.current.loadMore();
    });

    mockFeedReturn = makePage({ items: ["c"], nextCursor: null, seekingFresh: true });
    rerender({});

    const callsBeforeEndRetry = mockFeedCursorCalls.length;

    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.isSeekingFresh).toBe(true);

    const cursorsAfterExhaustion = mockFeedCursorCalls.slice(callsBeforeEndRetry);
    expect(cursorsAfterExhaustion).not.toContain(null);
    expect(cursorsAfterExhaustion).not.toContain(undefined);
  });

  it("keeps loadMore working while the server returns a nextCursor", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: "1", seekingFresh: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", seekingFresh: false });
    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.hasMoreLocal).toBe(true);
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);

    mockFeedReturn = makePage({ items: ["a"], nextCursor: "3", seekingFresh: false });
    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);
  });

  it("does not re-append the current page when the reactive query re-runs (refill)", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: "1", seekingFresh: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", seekingFresh: false });
    act(() => {
      result.current.loadMore();
    });
    rerender({});
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);

    mockFeedReturn = makePage({ items: ["b"], nextCursor: "2", seekingFresh: false });
    rerender({});
    expect(result.current.items.map((item) => item._id)).toEqual(["a", "b"]);
  });

  it("loadMore is a no-op once nextCursor is null", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: null, seekingFresh: true });
    const { result } = renderHook(() => useDiscoveryFeed());

    const callsBefore = mockFeedCursorCalls.length;
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(mockFeedCursorCalls.length).toBe(callsBefore);
  });

  it("surfaces a later page whose category rose after affinity changes", () => {
    mockFeedReturn = makePage({
      items: ["science-1"],
      nextCursor: "1",
      seekingFresh: false,
    });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());
    expect(result.current.items.map((item) => item._id)).toEqual(["science-1"]);

    mockFeedReturn = {
      items: [
        {
          ...makePage({ items: ["science-2"], nextCursor: "2", seekingFresh: false })
            .items[0]!,
          category: "science",
        },
      ],
      nextCursor: "2",
      seekingFresh: false,
    };

    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.items.map((item) => item._id)).toEqual([
      "science-1",
      "science-2",
    ]);
  });
});
