import { discoveryCardKicker, kindAccent } from "../src/features/content/card-presentation";
import type { ContentKind, ContentCardModel } from "../src/features/content/types";
import type { AppTheme } from "../src/features/theme/palette-catalog";

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

const theme: AppTheme = {
  paletteName: "brick",
  isDark: false,
  colors: {
    canvas: "#F5EFE8",
    canvasAccent: "#ECE1D4",
    surface: "#FFFDFC",
    surfaceMuted: "#F8F2EC",
    border: "rgba(87, 56, 36, 0.10)",
    heading: "#2B211D",
    text: "#43332B",
    textMuted: "#7A665C",
    accent: "#B14F2E",
    accentSoft: "#F2DED3",
    accentContrast: "#FFF8F4",
    premium: "#C8964A",
    premiumSoft: "rgba(200, 150, 74, 0.14)",
    videoAccent: "#5B7A9A",
    videoAccentSoft: "rgba(91, 122, 154, 0.12)",
    tabBar: "#EEE2D4",
    tabBarCard: "rgba(255, 252, 247, 0.92)",
    tabInactive: "#8A7468",
    inputBackground: "#FFFCF8",
    overlay: "rgba(43, 33, 29, 0.26)",
    danger: "#A23B2E",
    dangerSoft: "rgba(162, 59, 46, 0.10)",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radii: { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 },
  typography: {
    eyebrow: { size: 13, weight: "700", transform: "uppercase" },
    title: { size: 32, weight: "700" },
    sectionTitle: { size: 18, weight: "700" },
    body: { size: 16, lineHeight: 24 },
    caption: { size: 13, lineHeight: 18 },
  },
} as const;

describe("kindAccent", () => {
  it("returns accent/accentSoft for articles", () => {
    const result = kindAccent("article", theme);
    expect(result.accent).toBe("#B14F2E");
    expect(result.accentSoft).toBe("#F2DED3");
  });

  it("returns premium/premiumSoft for episodes", () => {
    const result = kindAccent("episode", theme);
    expect(result.accent).toBe("#C8964A");
    expect(result.accentSoft).toBe("rgba(200, 150, 74, 0.14)");
  });

  it("returns videoAccent/videoAccentSoft for videos", () => {
    const result = kindAccent("video", theme);
    expect(result.accent).toBe("#5B7A9A");
    expect(result.accentSoft).toBe("rgba(91, 122, 154, 0.12)");
  });

  it("all three kinds return distinct accent values", () => {
    const articleAccent = kindAccent("article", theme).accent;
    const episodeAccent = kindAccent("episode", theme).accent;
    const videoAccent = kindAccent("video", theme).accent;
    expect(articleAccent).not.toBe(episodeAccent);
    expect(articleAccent).not.toBe(videoAccent);
    expect(episodeAccent).not.toBe(videoAccent);
  });
});

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
