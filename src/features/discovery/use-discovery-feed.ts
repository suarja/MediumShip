import { useMutation, useQuery } from "convex/react";
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
  isExhausted: boolean;
};

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
      isExhausted: true,
    };
  }

  return data;
}

export function shouldRequestDiscoveryRefill(args: {
  itemCount: number;
  isExhausted: boolean;
  watermark?: number;
}): boolean {
  const watermark = args.watermark ?? DISCOVERY_LOW_WATERMARK;
  return args.isExhausted || args.itemCount < watermark;
}

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isExhausted: boolean;
  isSignedIn: boolean;
  recordLike: (contentId: Id<"contents">) => void;
  recordHide: (contentId: Id<"contents">) => void;
  refresh: () => void;
  loadMore: () => void;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const me = useQuery(api.users.queries.getMe, isSignedIn ? {} : "skip");
  const [feedSeed, setFeedSeed] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchCursor, setFetchCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<DiscoveryFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isExhausted, setIsExhausted] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const refillRequestedRef = useRef(false);
  const pendingAppendRef = useRef<string | null>(null);

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
    setIsExhausted(false);
    setIsLoadingMore(false);
    refillRequestedRef.current = false;
    pendingAppendRef.current = null;
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
    setIsExhausted(page.isExhausted);

    setAllItems((previous) => {
      if (fetchCursor === null) {
        return page.items;
      }

      const existingIds = new Set(previous.map((item) => item._id));
      const appended = page.items.filter((item) => !existingIds.has(item._id));
      return [...previous, ...appended];
    });

    pendingAppendRef.current = null;
  }, [rawPage, fetchCursor]);

  useEffect(() => {
    if (
      !shouldRequestDiscoveryRefill({
        itemCount: allItems.length,
        isExhausted,
      }) ||
      refillRequestedRef.current
    ) {
      return;
    }

    refillRequestedRef.current = true;
    void requestRefill({ tenantSlug });
  }, [allItems.length, isExhausted, requestRefill, tenantSlug]);

  const recordLike = useCallback(
    (contentId: Id<"contents">) => {
      if (!isSignedIn) {
        return;
      }

      void recordInteraction({
        tenantSlug,
        contentId,
        type: "like",
      });
    },
    [isSignedIn, recordInteraction, tenantSlug],
  );

  const recordHide = useCallback(
    (contentId: Id<"contents">) => {
      if (!isSignedIn) {
        return;
      }

      void recordInteraction({
        tenantSlug,
        contentId,
        type: "hide",
      });
    },
    [isSignedIn, recordInteraction, tenantSlug],
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
    isExhausted,
    isSignedIn,
    recordLike,
    recordHide,
    refresh,
    loadMore,
  };
}
