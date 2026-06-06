import { render, screen } from "@testing-library/react-native";

import DiscoverScreen from "../app/(app)/discover";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { DiscoveryFeedItem } from "../src/features/discovery/use-discovery-feed";

const mockUseAppTheme = jest.fn();
const mockUseDiscoveryFeed = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("../src/features/discovery/use-discovery-feed", () => ({
  useDiscoveryFeed: () => mockUseDiscoveryFeed(),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

function makeTheme(enabledModules: string[]) {
  return {
    tenantSlug: "demo-media",
    enabledModules,
    feedSections: [],
    theme: {
      colors: {
        heading: "#000",
        text: "#000",
        textMuted: "#666",
        border: "#eee",
        surface: "#fff",
        accent: "#0000ff",
        accentContrast: "#fff",
        accentSoft: "#eef",
        premium: "#c9a227",
        canvas: "#fff",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12 },
      isDark: false,
    },
  };
}

const SAMPLE_FEED: DiscoveryFeedItem[] = [
  {
    _id: "article-1",
    tenantSlug: "demo-media",
    kind: "article",
    status: "published",
    title: "Economie du soin",
    summary: "Une analyse",
    category: "Analyse",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-03T08:00:00.000Z",
    reason: "editorial",
  },
  {
    _id: "episode-1",
    tenantSlug: "demo-media",
    kind: "episode",
    status: "published",
    title: "West Texas Boom Report",
    summary: "Reportage",
    category: "Podcast",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-03T09:00:00.000Z",
    durationSeconds: 1800,
    reason: "random",
  },
];

describe("discover screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme(["articles", "episodes", "videos", "discover"]),
    );
    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED,
      isLoading: false,
    });
    await changeAppLanguage("fr");
  });

  it("renders nothing when discover is absent from enabledModules", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(["articles", "episodes", "videos"]));

    const { toJSON } = render(<DiscoverScreen />);

    expect(toJSON()).toBeNull();
  });

  it("renders a content card per feed item", () => {
    render(<DiscoverScreen />);

    expect(screen.getByText("Economie du soin")).toBeTruthy();
    expect(screen.getByText("West Texas Boom Report")).toBeTruthy();
  });

  it("groups the feed into meaningful sections with explanatory copy", () => {
    render(<DiscoverScreen />);

    expect(screen.getByTestId("discover-section-editorial")).toBeTruthy();
    expect(screen.getByTestId("discover-section-random")).toBeTruthy();
    expect(screen.getByText("À la une")).toBeTruthy();
    expect(screen.getByText(/publications les plus récentes/i)).toBeTruthy();
    expect(screen.getByText("À redécouvrir")).toBeTruthy();
    expect(screen.getByText(/pépite oubliée/i)).toBeTruthy();
    expect(screen.queryByText("Surprise")).toBeNull();
    expect(screen.queryByText("Sélection éditoriale")).toBeNull();
  });

  it("renders a loading skeleton while the feed is loading", () => {
    mockUseDiscoveryFeed.mockReturnValue({
      items: [],
      isLoading: true,
    });

    render(<DiscoverScreen />);

    expect(screen.getByTestId("discover-loading")).toBeTruthy();
  });

  it("renders an empty fallback when the feed has no items", () => {
    mockUseDiscoveryFeed.mockReturnValue({
      items: [],
      isLoading: false,
    });

    render(<DiscoverScreen />);

    expect(screen.getByTestId("discover-empty")).toBeTruthy();
  });

  it("renders for guests without requiring authentication", () => {
    render(<DiscoverScreen />);

    expect(screen.getByTestId("discover-screen")).toBeTruthy();
    expect(screen.getByText("Découvrir")).toBeTruthy();
  });
});
