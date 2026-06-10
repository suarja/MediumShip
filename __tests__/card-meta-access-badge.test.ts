import { cardMeta } from "../src/features/content/card-presentation";
import type { ContentCardModel } from "../src/features/content/types";
import * as featureAccess from "../src/features/tenant/feature-access";

const baseItem: ContentCardModel = {
  id: "1",
  kind: "article",
  kindLabel: "Article",
  category: "Science",
  title: "Title",
  summary: "Summary",
  metaLabel: "Meta",
  href: "/article/1",
  isPremium: true,
  readingTimeMinutes: 12,
};

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === "minRead") return `${options?.count} min read`;
  if (key === "premiumTag") return "Premium";
  return key;
};

describe("cardMeta access badges", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("appends a premium tag only when the content is locked", () => {
    jest.spyOn(featureAccess, "canAccessFeatureLevel").mockImplementation((access, ctx) => {
      if (access === "free") return true;
      if (access === "member") return ctx.isAuthenticated;
      return ctx.isPro;
    });

    expect(
      cardMeta(baseItem, t, { isAuthenticated: false, isPro: false }),
    ).toBe("12 min read · Premium");

    expect(
      cardMeta(baseItem, t, { isAuthenticated: true, isPro: true }),
    ).toBe("12 min read");
  });
});
