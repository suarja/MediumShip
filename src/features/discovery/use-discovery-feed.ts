import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { FeedReason } from "../../../convex/discovery/scoring";
import type { ContentDoc } from "../content/types";
import { useAppTheme } from "../theme/theme-provider";

export type DiscoveryFeedItem = ContentDoc & {
  reason: FeedReason;
};

export function useDiscoveryFeed(): {
  items: DiscoveryFeedItem[];
  isLoading: boolean;
} {
  const { tenantSlug } = useAppTheme();
  const data = useQuery(api.discovery.feed.getDiscoveryFeed, { tenantSlug });

  return {
    items: (data as DiscoveryFeedItem[] | undefined) ?? [],
    isLoading: data === undefined,
  };
}
