import { describe, expect, it } from "@jest/globals";

import { groupDiscoveryFeedSections } from "../src/features/discovery/group-feed-sections";
import type { DiscoveryFeedItem } from "../src/features/discovery/use-discovery-feed";

function item(
  id: string,
  reason: DiscoveryFeedItem["reason"],
): DiscoveryFeedItem {
  return {
    _id: id,
    tenantSlug: "demo-media",
    kind: "article",
    status: "published",
    title: id,
    summary: "Summary",
    category: "Analyse",
    tags: [],
    isPremium: false,
    reason,
  };
}

describe("groupDiscoveryFeedSections", () => {
  it("groups items by reason in a stable editorial-first order", () => {
    const sections = groupDiscoveryFeedSections([
      item("random-1", "random"),
      item("editorial-1", "editorial"),
      item("random-2", "random"),
      item("editorial-2", "editorial"),
    ]);

    expect(sections.map((section) => section.reason)).toEqual(["editorial", "random"]);
    expect(sections[0]?.items.map((entry) => entry._id)).toEqual([
      "editorial-1",
      "editorial-2",
    ]);
    expect(sections[1]?.items.map((entry) => entry._id)).toEqual(["random-1", "random-2"]);
  });
});
