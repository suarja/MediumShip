import { discoveryCardKicker } from "../src/features/content/card-presentation";
import type { ContentCardModel } from "../src/features/content/types";

const baseItem: ContentCardModel = {
  id: "1",
  kind: "video",
  kindLabel: "Video",
  category: "Science",
  title: "Title",
  summary: "Summary",
  metaLabel: "Meta",
  href: "/video/1",
  isPremium: false,
};

const t = (key: string) => key;
const tDiscover = (key: string) => {
  const map: Record<string, string> = {
    "source.youtube": "YouTube",
    "source.wikipedia": "Wikipedia",
    "source.rss": "RSS",
    "sections.archive.title": "Des archives",
  };
  return map[key] ?? key;
};

describe("discoveryCardKicker", () => {
  it("shows the provider for youtube content, not the section bucket", () => {
    expect(
      discoveryCardKicker({ ...baseItem, source: "youtube" }, "archive", t, tDiscover),
    ).toBe("YouTube");
  });

  it("shows the provider for rss content", () => {
    expect(
      discoveryCardKicker({ ...baseItem, source: "rss" }, "personalized", t, tDiscover),
    ).toBe("RSS");
  });

  it("keeps Wikipedia attribution", () => {
    expect(
      discoveryCardKicker(
        { ...baseItem, source: "wikipedia" },
        "personalized",
        t,
        tDiscover,
      ),
    ).toBe("Wikipedia");
  });

  it("falls back to the section label for CMS content", () => {
    expect(
      discoveryCardKicker({ ...baseItem, source: "cms" }, "archive", t, tDiscover),
    ).toBe("Des archives");
  });

  it("falls back to the category when no section label exists", () => {
    expect(
      discoveryCardKicker({ ...baseItem, source: "cms" }, "unknown", t, tDiscover),
    ).toBe("Science");
  });
});
