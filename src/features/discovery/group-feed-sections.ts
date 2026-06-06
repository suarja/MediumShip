import type { FeedReason } from "../../../convex/discovery/scoring";
import type { DiscoveryFeedItem } from "./use-discovery-feed";

export type DiscoveryFeedSection = {
  reason: FeedReason;
  items: DiscoveryFeedItem[];
};

const SECTION_ORDER: FeedReason[] = [
  "personalized",
  "editorial",
  "archive",
  "random",
];

/** Groups a mixed discovery feed into stable, user-facing sections. */
export function groupDiscoveryFeedSections(
  items: readonly DiscoveryFeedItem[],
): DiscoveryFeedSection[] {
  const buckets = new Map<FeedReason, DiscoveryFeedItem[]>();

  for (const item of items) {
    const bucket = buckets.get(item.reason) ?? [];
    bucket.push(item);
    buckets.set(item.reason, bucket);
  }

  return SECTION_ORDER.filter((reason) => buckets.has(reason)).map((reason) => ({
    reason,
    items: buckets.get(reason) ?? [],
  }));
}
