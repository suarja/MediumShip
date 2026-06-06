import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FeedReason } from "../../../convex/discovery/scoring";
import { useClerkAuth } from "../auth/use-clerk-auth";
import type { ContentDoc } from "../content/types";
import { useAppTheme } from "../theme/theme-provider";

export type DiscoveryFeedItem = ContentDoc & {
  reason: FeedReason;
  isLiked: boolean;
};

export const DISCOVERY_PAGE_SIZE = 10;
export const DISCOVERY_LOW_WATERMARK = 5;

type DiscoveryFeedPage = {
  items: DiscoveryFeedItem[];
  nextCursor: string | null;
  recycling: boolean;
};

export function discoveryFeedItemKey(item: DiscoveryFeedItem, index: number): string {
  return `${index}-${item._id}`;
}

export function normalizeDiscoveryFeedPage(
  data: DiscoveryFeedPage | DiscoveryFeedItem[] | undefined,
): DiscoveryFeedPage | undefined {
  if (data === undefined) {
    return undefined;
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      nextCursor: null,
      recycling: false,
    };
  }

  return data;
}

export function shouldRequestDiscoveryRefill(args: {
  itemCount: number;
  recycling: boolean;
  watermark?: number;
}): boolean {
  const watermark = args.watermark ?? DISCOVERY_LOW_WATERMARK;
  return args.recycling || args.itemCount < watermark;
}

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isRecycling: boolean;
  isSignedIn: boolean;
  recordLike: (contentId: Id<"contents">) => void;
  recordHide: (contentId: Id<"contents">) => void;
  refresh: () => void;
  loadMore: () => void;
  hasMoreLocal: boolean;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn: isClerkSignedIn } = useClerkAuth();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.queries.getMe, isClerkSignedIn ? {} : "skip");
  const [feedSeed, setFeedSeed] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchCursor, setFetchCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<DiscoveryFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isRecycling, setIsRecycling] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const refillRequestedRef = useRef(false);
  const pendingAppendRef = useRef<string | null>(null);
  const lastAppendedCursorRef = useRef<string | undefined>(undefined);

  const rawPage = useQuery(api.discovery.feed.getDiscoveryFeed, {
    tenantSlug,
    tokenIdentifier: me?.tokenIdentifier,
    feedSeed,
    cursor: fetchCursor,
    limit: DISCOVERY_PAGE_SIZE,
  });

  const page = normalizeDiscoveryFeedPage(
    rawPage as DiscoveryFeedPage | DiscoveryFeedItem[] | undefined,
  );

  const recordInteraction = useMutation(api.discovery.interactions.recordInteraction);
  const requestRefill = useMutation(api.discovery.refill.requestDiscoveryRefill);

  useEffect(() => {
    setFetchCursor(null);
    setAllItems([]);
    setNextCursor(null);
    setIsRecycling(false);
    setIsLoadingMore(false);
    refillRequestedRef.current = false;
    pendingAppendRef.current = null;
    lastAppendedCursorRef.current = undefined;
  }, [feedSeed, tenantSlug, me?.tokenIdentifier]);

  useEffect(() => {
    const page = normalizeDiscoveryFeedPage(
      rawPage as DiscoveryFeedPage | DiscoveryFeedItem[] | undefined,
    );
    if (page === undefined) {
      return;
    }

    setIsRefreshing(false);
    setIsLoadingMore(false);
    setNextCursor(page.nextCursor);
    setIsRecycling(page.recycling);

    if (page.recycling) {
      refillRequestedRef.current = false;
    }

    // NOTE: do NOT reset fetchCursor to page 0 on exhaustion. Doing so makes
    // page 0 report a non-null nextCursor again, so onEndReached/loadMore
    // re-paginates to the end, resets, and loops forever — an infinite
    // getDiscoveryFeed loop (cost + always-same-content). When the corpus
    // grows (refill), new content is picked up via pull-to-refresh (new
    // feedSeed) or the page-0 reactive append below — never by cursor reset.

    // The feed query is reactive: the CURRENT page re-runs whenever the corpus
    // grows (refill). Append a given cursor's page at most once, otherwise the
    // reactive re-run re-appends it and the same article shows up twice within
    // a few items. loadMore advances the cursor, so genuinely new pages (incl.
    // intentional recycled repeats with a different cursor) still append.
    const cursorKey = fetchCursor ?? "__page0__";
    if (lastAppendedCursorRef.current !== cursorKey) {
      lastAppendedCursorRef.current = cursorKey;
      setAllItems((previous) =>
        fetchCursor === null ? page.items : [...previous, ...page.items],
      );
    }

    pendingAppendRef.current = null;
  }, [rawPage, fetchCursor]);

  useEffect(() => {
    if (
      !shouldRequestDiscoveryRefill({
        itemCount: allItems.length,
        recycling: isRecycling,
      }) ||
      refillRequestedRef.current
    ) {
      return;
    }

    refillRequestedRef.current = true;
    void requestRefill({ tenantSlug });
  }, [allItems.length, isRecycling, requestRefill, tenantSlug]);

  const recordLike = useCallback(
    (contentId: Id<"contents">) => {
      if (!isAuthenticated) {
        return;
      }

      setAllItems((previous) =>
        previous.map((item) =>
          item._id === contentId ? { ...item, isLiked: !item.isLiked } : item,
        ),
      );

      void recordInteraction({
        tenantSlug,
        contentId,
        type: "like",
      });
    },
    [isAuthenticated, recordInteraction, tenantSlug],
  );

  const recordHide = useCallback(
    (contentId: Id<"contents">) => {
      if (!isAuthenticated) {
        return;
      }

      void recordInteraction({
        tenantSlug,
        contentId,
        type: "hide",
      });
    },
    [isAuthenticated, recordInteraction, tenantSlug],
  );

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setFeedSeed((current) => current + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (
      page === undefined ||
      isLoadingMore ||
      nextCursor === null ||
      pendingAppendRef.current === nextCursor
    ) {
      return;
    }

    pendingAppendRef.current = nextCursor;
    setIsLoadingMore(true);
    setFetchCursor(nextCursor);
  }, [isLoadingMore, nextCursor, page]);

  const items = useMemo(() => allItems, [allItems]);

  return {
    items,
    isLoading: page === undefined && allItems.length === 0,
    isRefreshing,
    isLoadingMore,
    isRecycling,
    isSignedIn: isAuthenticated,
    recordLike,
    recordHide,
    refresh,
    loadMore,
    hasMoreLocal: nextCursor !== null,
  };
}
