import { act, renderHook } from "@testing-library/react-native";

import {
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
  isExhausted: boolean;
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
    isExhausted: args.isExhausted,
  };
}

describe("useDiscoveryFeed — no infinite pagination loop", () => {
  beforeEach(() => {
    mockFeedCursorCalls.length = 0;
  });

  it("does not reset the query cursor to page 0 after an exhausted terminal page", () => {
    mockFeedReturn = makePage({ items: ["a", "b"], nextCursor: "2", isExhausted: false });
    const { result, rerender } = renderHook(() => useDiscoveryFeed());

    // Paginate to the next page.
    act(() => {
      result.current.loadMore();
    });

    // Server returns the terminal page (no more, exhausted) for cursor "2".
    mockFeedReturn = makePage({ items: ["c"], nextCursor: null, isExhausted: true });
    rerender({});

    const callsBeforeEndRetry = mockFeedCursorCalls.length;

    // Reaching the end again must be a no-op: nextCursor is null, and the hook
    // must NOT reset the cursor (which previously re-opened pagination → loop).
    act(() => {
      result.current.loadMore();
    });
    rerender({});

    expect(result.current.isExhausted).toBe(true);

    const cursorsAfterExhaustion = mockFeedCursorCalls.slice(callsBeforeEndRetry);
    // No new fetch with a reset cursor (null/page-0) after exhaustion.
    expect(cursorsAfterExhaustion).not.toContain(null);
    expect(cursorsAfterExhaustion).not.toContain(undefined);
  });

  it("loadMore is a no-op once nextCursor is null", () => {
    mockFeedReturn = makePage({ items: ["a"], nextCursor: null, isExhausted: true });
    const { result } = renderHook(() => useDiscoveryFeed());

    const callsBefore = mockFeedCursorCalls.length;
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    // No extra feed queries were issued by the repeated loadMore calls.
    expect(mockFeedCursorCalls.length).toBe(callsBefore);
  });
});
