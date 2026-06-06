import { fireEvent, render, screen } from "@testing-library/react-native";

import DiscoverScreen from "../app/(app)/discover";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { DiscoveryFeedItem } from "../src/features/discovery/use-discovery-feed";

const mockUseAppTheme = jest.fn();
const mockUseDiscoveryFeed = jest.fn();
const mockRecordLike = jest.fn();
const mockRecordHide = jest.fn();
const mockRefresh = jest.fn();
const mockToggleBookmark = jest.fn();
const mockOpenContentActions = jest.fn();

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

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    toggleBookmark: mockToggleBookmark,
    isBookmarksLoading: false,
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

jest.mock("../src/features/content/content-actions-sheet-provider", () => ({
  useContentActionsSheet: () => ({
    openContentActions: mockOpenContentActions,
    closeContentActions: jest.fn(),
  }),
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
        canvasAccent: "#eee",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
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
    isLiked: false,
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
    isLiked: true,
  },
];

describe("discover screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockRecordLike.mockClear();
    mockRecordHide.mockClear();
    mockRefresh.mockClear();
    mockToggleBookmark.mockClear();
    mockOpenContentActions.mockClear();
    mockUseAppTheme.mockReturnValue(
      makeTheme(["articles", "episodes", "videos", "discover", "bookmarks"]),
    );
    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED,
      isLoading: false,
      isRefreshing: false,
      isSignedIn: true,
      recordLike: mockRecordLike,
      recordHide: mockRecordHide,
      refresh: mockRefresh,
    });
    await changeAppLanguage("fr");
  });

  it("renders nothing when discover is absent from enabledModules", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(["articles", "episodes", "videos"]));

    const { toJSON } = render(<DiscoverScreen />);

    expect(toJSON()).toBeNull();
  });

  it("renders a feature content card per feed item", () => {
    render(<DiscoverScreen />);

    expect(screen.getAllByTestId("content-card-feature")).toHaveLength(2);
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

  it("records a like without removing the card from the list", () => {
    render(<DiscoverScreen />);

    fireEvent.press(screen.getAllByTestId("discover-like-button")[0]);

    expect(mockRecordLike).toHaveBeenCalledWith("article-1");
    expect(screen.getByText("Economie du soin")).toBeTruthy();
    expect(screen.getByText("West Texas Boom Report")).toBeTruthy();
  });

  it("reflects isLiked on the like control", () => {
    render(<DiscoverScreen />);

    const likeButtons = screen.getAllByTestId("discover-like-button");
    expect(likeButtons[0].props.accessibilityLabel).toBe("Aimer");
    expect(likeButtons[1].props.accessibilityLabel).toBe("Aimer");
  });

  it("does not render skip affordances", () => {
    render(<DiscoverScreen />);

    expect(screen.queryAllByTestId("discover-skip-button")).toHaveLength(0);
  });

  it("does not render member actions for guests", () => {
    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED,
      isLoading: false,
      isRefreshing: false,
      isSignedIn: false,
      recordLike: mockRecordLike,
      recordHide: mockRecordHide,
      refresh: mockRefresh,
    });

    render(<DiscoverScreen />);

    expect(screen.queryAllByTestId("discover-like-button")).toHaveLength(0);
    expect(screen.queryAllByTestId("discover-favorite-button")).toHaveLength(0);
    expect(screen.queryAllByTestId("discover-overflow-button")).toHaveLength(0);
    expect(mockRecordLike).not.toHaveBeenCalled();
  });

  it("triggers a feed refresh when the user pulls down", () => {
    render(<DiscoverScreen />);

    const refreshControl = screen.getByTestId("discover-scroll").props.refreshControl;
    refreshControl.props.onRefresh();

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows the refresh spinner while the feed is recomputing", () => {
    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED,
      isLoading: false,
      isRefreshing: true,
      isSignedIn: true,
      recordLike: mockRecordLike,
      recordHide: mockRecordHide,
      refresh: mockRefresh,
    });

    render(<DiscoverScreen />);

    expect(screen.getByTestId("discover-scroll").props.refreshControl.props.refreshing).toBe(
      true,
    );
  });

  it("wires the Favoris toggle without removing the card", () => {
    render(<DiscoverScreen />);

    fireEvent.press(screen.getAllByTestId("discover-favorite-button")[0]);

    expect(mockToggleBookmark).toHaveBeenCalledWith({ contentId: "article-1" });
    expect(screen.getByText("Economie du soin")).toBeTruthy();
  });

  it("exposes the FR Favoris label on the bookmark icon accessibility", () => {
    render(<DiscoverScreen />);

    const favoriteButtons = screen.getAllByTestId("discover-favorite-button");
    expect(favoriteButtons[0]?.props.accessibilityLabel).toBe("Favoris");
  });

  it("opens the shared actions sheet in discovery context from overflow", () => {
    render(<DiscoverScreen />);

    fireEvent.press(screen.getAllByTestId("discover-overflow-button")[0]);

    expect(mockOpenContentActions).toHaveBeenCalledWith("article-1", "discovery");
  });

  it("keeps hidden content in the feed until refresh recomputes it", () => {
    const { rerender } = render(<DiscoverScreen />);

    expect(screen.getByText("Economie du soin")).toBeTruthy();

    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED,
      isLoading: false,
      isRefreshing: false,
      isSignedIn: true,
      recordLike: mockRecordLike,
      recordHide: mockRecordHide,
      refresh: mockRefresh,
    });

    rerender(<DiscoverScreen />);
    expect(screen.getByText("Economie du soin")).toBeTruthy();

    mockUseDiscoveryFeed.mockReturnValue({
      items: SAMPLE_FEED.filter((item) => item._id !== "article-1"),
      isLoading: false,
      isRefreshing: false,
      isSignedIn: true,
      recordLike: mockRecordLike,
      recordHide: mockRecordHide,
      refresh: mockRefresh,
    });

    rerender(<DiscoverScreen />);
    expect(screen.queryByText("Economie du soin")).toBeNull();
    expect(screen.getByText("West Texas Boom Report")).toBeTruthy();
  });
});
