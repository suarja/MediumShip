import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FeedReason } from "../../../convex/discovery/scoring";
import { useClerkAuth } from "../auth/use-clerk-auth";
import type { ContentDoc } from "../content/types";
import { useAppTheme } from "../theme/theme-provider";

export type DiscoveryFeedItem = ContentDoc & {
  reason: FeedReason;
};

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSignedIn: boolean;
  recordSkip: (contentId: Id<"contents">) => void;
  recordLike: (contentId: Id<"contents">) => void;
  refresh: () => void;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const me = useQuery(api.users.queries.getMe, isSignedIn ? {} : "skip");
  // Re-rolled on pull-to-refresh so jitter and affinity changes reshape the feed.
  const [feedSeed, setFeedSeed] = useState(0);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = useQuery(api.discovery.feed.getDiscoveryFeed, {
    tenantSlug,
    tokenIdentifier: me?.tokenIdentifier,
    feedSeed,
  });

  const recordInteraction = useMutation(api.discovery.interactions.recordInteraction);

  useEffect(() => {
    if (data !== undefined) {
      setIsRefreshing(false);
    }
  }, [data, feedSeed]);

  const recordSkip = useCallback(
    (contentId: Id<"contents">) => {
      setRemovedIds((current) => new Set([...current, contentId]));

      if (!isSignedIn) {
        return;
      }

      void recordInteraction({
        tenantSlug,
        contentId,
        type: "skip",
      });
    },
    [isSignedIn, recordInteraction, tenantSlug],
  );

  const recordLike = useCallback(
    (contentId: Id<"contents">) => {
      setRemovedIds((current) => new Set([...current, contentId]));

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

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRemovedIds(new Set());
    setFeedSeed((current) => current + 1);
  }, []);

  const items = useMemo(
    () =>
      ((data as DiscoveryFeedItem[] | undefined) ?? []).filter(
        (item) => !removedIds.has(item._id),
      ),
    [data, removedIds],
  );

  return {
    items,
    isLoading: data === undefined,
    isRefreshing,
    isSignedIn,
    recordSkip,
    recordLike,
    refresh,
  };
}
