import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FeedReason } from "../../../convex/discovery/scoring";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { getGuestCategoryInterests } from "../categories/guest-category-interests";
import type { ContentDoc } from "../content/types";
import { subscribeDiscoveryFeedRefresh } from "./discovery-feed-refresh";
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
  seekingFresh: boolean;
};

export function discoveryFeedItemKey(item: DiscoveryFeedItem): string {
  return item._id;
}

export function mergeDiscoveryFeedItems(
  previous: DiscoveryFeedItem[],
  incoming: DiscoveryFeedItem[],
  reset: boolean,
): DiscoveryFeedItem[] {
  const seen = new Set(
    reset ? [] : previous.map((item) => item._id),
  );
  const next = reset ? [] : [...previous];

  for (const item of incoming) {
    if (seen.has(item._id)) {
      continue;
    }

    seen.add(item._id);
    next.push(item);
  }

  return next;
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
      seekingFresh: false,
    };
  }

  return data;
}

export function shouldRequestDiscoveryRefill(args: {
  itemCount: number;
  seekingFresh: boolean;
  watermark?: number;
}): boolean {
  const watermark = args.watermark ?? DISCOVERY_LOW_WATERMARK;
  return args.seekingFresh || args.itemCount < watermark;
}

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isSeekingFresh: boolean;
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
  // Guest-local interests seed the feed before sign-in (Tranche 2b). Reloaded on
  // mount and on every refresh signal (e.g. after onboarding applies a pick).
  const [guestCategoryKeys, setGuestCategoryKeys] = useState<string[]>([]);

  const reloadGuestKeys = useCallback(() => {
    if (isAuthenticated) {
      setGuestCategoryKeys((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    void getGuestCategoryInterests().then((keys) =>
      setGuestCategoryKeys((prev) =>
        prev.length === keys.length && prev.every((key, i) => key === keys[i]) ? prev : keys,
      ),
    );
  }, [isAuthenticated]);

  useEffect(() => {
    reloadGuestKeys();
  }, [reloadGuestKeys]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchCursor, setFetchCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<DiscoveryFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isSeekingFresh, setIsSeekingFresh] = useState(false);
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
    guestCategoryKeys:
      !isAuthenticated && guestCategoryKeys.length > 0 ? guestCategoryKeys : undefined,
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
    setIsSeekingFresh(false);
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
    setIsSeekingFresh(page.seekingFresh);

    if (page.seekingFresh) {
      refillRequestedRef.current = false;
    }

    // NOTE: do NOT reset fetchCursor to page 0 on exhaustion. Doing so makes
    // page 0 report a non-null nextCursor again, so onEndReached/loadMore
    // re-paginates to the end, resets, and loops forever — an infinite
    // getDiscoveryFeed loop (cost + always-same-content). When the corpus
    // grows (refill), new content is picked up via pull-to-refresh (new
    // feedSeed) or the page-0 reactive append below — never by cursor reset.

    const cursorKey = fetchCursor ?? "__page0__";
    if (lastAppendedCursorRef.current !== cursorKey) {
      lastAppendedCursorRef.current = cursorKey;
      setAllItems((previous) =>
        mergeDiscoveryFeedItems(
          previous,
          page.items,
          fetchCursor === null,
        ),
      );
    }

    pendingAppendRef.current = null;
  }, [rawPage, fetchCursor]);

  useEffect(() => {
    if (
      !shouldRequestDiscoveryRefill({
        itemCount: allItems.length,
        seekingFresh: isSeekingFresh,
      }) ||
      refillRequestedRef.current
    ) {
      return;
    }

    refillRequestedRef.current = true;
    void requestRefill({ tenantSlug });
  }, [allItems.length, isSeekingFresh, requestRefill, tenantSlug]);

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
    reloadGuestKeys();
    setIsRefreshing(true);
    setFeedSeed((current) => current + 1);
  }, [reloadGuestKeys]);

  useEffect(() => subscribeDiscoveryFeedRefresh(refresh), [refresh]);

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
    isSeekingFresh,
    isSignedIn: isAuthenticated,
    recordLike,
    recordHide,
    refresh,
    loadMore,
    hasMoreLocal: nextCursor !== null,
  };
}
