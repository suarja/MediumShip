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
  isLiked: boolean;
};

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSignedIn: boolean;
  recordLike: (contentId: Id<"contents">) => void;
  recordHide: (contentId: Id<"contents">) => void;
  refresh: () => void;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const me = useQuery(api.users.queries.getMe, isSignedIn ? {} : "skip");
  // Re-rolled on pull-to-refresh so jitter and affinity changes reshape the feed.
  const [feedSeed, setFeedSeed] = useState(0);
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

  const items = useMemo(
    () => (data as DiscoveryFeedItem[] | undefined) ?? [],
    [data],
  );

  return {
    items,
    isLoading: data === undefined,
    isRefreshing,
    isSignedIn,
    recordLike,
    recordHide,
    refresh,
  };
}
