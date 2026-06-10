import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react-native";

import { api } from "../convex/_generated/api";
import ArticleDetailScreen from "../app/article/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { ContentDoc } from "../src/features/content/types";

const mockUseQuery = jest.fn();
const mockFetchArticleBody = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useAction: () => mockFetchArticleBody,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({ id: "wiki_1" }),
  useGlobalSearchParams: () => ({}),
  useSegments: () => ["(app)"],
  usePathname: () => "/article/wiki_1",
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({
    downloadedItem: null,
    isLoading: false,
    isDownloading: false,
    downloadContent: jest.fn(),
  }),
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    scaleFont: (value: number) => value,
    scaleSpace: (value: number) => value,
    contentMaxWidth: 720,
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: false }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    toggleBookmark: jest.fn(),
    isBookmarksLoading: false,
  }),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: jest.fn() }),
}));

jest.mock("../src/features/personal-lists/use-personal-lists", () => ({
  usePersonalLists: () => ({
    canCreateAnother: true,
    createList: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    tenantSlug: "demo-media",
    enabledModules: ["articles", "discover", "bookmarks", "offline", "personalLists"],
    theme: {
      isDark: false,
      colors: {
        canvas: "#F4F1E8",
        canvasAccent: "#E8E4DA",
        heading: "#1A1A1A",
        text: "#1A1A1A",
        textMuted: "#6B6560",
        accent: "#C97349",
        border: "#D8D2C8",
        surface: "#FFFFFF",
        surfaceMuted: "#ECE7DA",
      },
      radii: { md: 12, xl: 16, pill: 99 },
      spacing: { md: 12, lg: 16, xl: 24, xxl: 32 },
    },
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    LinearGradient: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

const WIKI_BASE: ContentDoc = {
  _id: "wiki_1",
  tenantSlug: "demo-media",
  kind: "article",
  status: "published",
  title: "Quantum mechanics",
  summary: "Quantum mechanics is a fundamental theory in physics.",
  category: "science",
  tags: [],
  isPremium: false,
  publishedAt: "2026-06-07T12:00:00.000Z",
  source: "wikipedia",
  externalId: "42",
  canonicalUrl: "https://en.wikipedia.org/wiki/Quantum_mechanics",
};

const CMS_ARTICLE: ContentDoc = {
  _id: "cms_1",
  tenantSlug: "demo-media",
  kind: "article",
  status: "published",
  title: "Economie du soin",
  summary: "Une analyse longue.",
  category: "Analyse",
  tags: [],
  isPremium: false,
  publishedAt: "2026-06-03T09:00:00.000Z",
  source: "cms",
  articleBody: "Premier paragraphe editorial.\n\nDeuxieme paragraphe editorial.",
};

function mockContentQuery(getContent: () => ContentDoc | null | undefined) {
  mockUseQuery.mockImplementation((queryRef: unknown, args: unknown) => {
    if (args === "skip") {
      return undefined;
    }
    if (
      queryRef === api.personalLists.queries.listMineForContent ||
      (args &&
        typeof args === "object" &&
        "contentId" in (args as Record<string, unknown>))
    ) {
      return [];
    }
    return getContent();
  });
}

describe("article detail immersion", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockUseQuery.mockReset();
    mockFetchArticleBody.mockReset();
    mockFetchArticleBody.mockResolvedValue({ articleBody: "", fetched: false });
  });

  it("fetches a missing wikipedia body once, shows loading, then renders paragraphs", async () => {
    let content: ContentDoc | null = { ...WIKI_BASE };
    mockContentQuery(() => content);

    let resolveFetch!: (value: { articleBody: string; fetched: boolean }) => void;
    const fetchPromise = new Promise<{ articleBody: string; fetched: boolean }>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetchArticleBody.mockReturnValue(fetchPromise);

    const view = render(<ArticleDetailScreen />);

    expect(screen.getByText(WIKI_BASE.summary)).toBeTruthy();
    expect(screen.getByText("Loading full article…")).toBeTruthy();
    expect(mockFetchArticleBody).toHaveBeenCalledTimes(1);
    expect(mockFetchArticleBody).toHaveBeenCalledWith({ contentId: "wiki_1" });

    content = {
      ...WIKI_BASE,
      articleBody: "First full paragraph.\n\nSecond full paragraph.",
    };

    await act(async () => {
      resolveFetch({ articleBody: content!.articleBody!, fetched: true });
      await fetchPromise;
    });

    view.rerender(<ArticleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("First full paragraph.")).toBeTruthy();
      expect(screen.getByText("Second full paragraph.")).toBeTruthy();
    });
    expect(screen.queryByText(WIKI_BASE.summary)).toBeNull();
    expect(screen.queryByText("Loading full article…")).toBeNull();
    expect(
      screen.queryByText(
        "You are reading an excerpt ingested from the source. The full article remains on the original site.",
      ),
    ).toBeNull();
    expect(screen.getByText("Read on Wikipedia")).toBeTruthy();
  });

  it("renders MediaWiki headings and places the source link after the body", () => {
    mockContentQuery(() => ({
      ...WIKI_BASE,
      articleBody:
        "Intro paragraph.\n\n== History ==\n\nEvents unfolded quickly.\n\n=== Early years ===\n\nMore detail.",
    }));

    render(<ArticleDetailScreen />);

    expect(screen.getByText("History")).toBeTruthy();
    expect(screen.getByText("Early years")).toBeTruthy();
    expect(screen.queryByText(WIKI_BASE.summary)).toBeNull();

    const intro = screen.getByText("Intro paragraph.");
    const link = screen.getByText("Read on Wikipedia");
    expect(intro).toBeTruthy();
    expect(link).toBeTruthy();
  });

  it("renders cached articleBody immediately without fetching", () => {
    mockContentQuery(() => ({
      ...WIKI_BASE,
      articleBody: "Cached paragraph one.\n\nCached paragraph two.",
    }));

    render(<ArticleDetailScreen />);

    expect(screen.getByText("Cached paragraph one.")).toBeTruthy();
    expect(screen.getByText("Cached paragraph two.")).toBeTruthy();
    expect(screen.queryByText(WIKI_BASE.summary)).toBeNull();
    expect(mockFetchArticleBody).not.toHaveBeenCalled();
    expect(screen.queryByText("Loading full article…")).toBeNull();
  });

  it("renders CMS article bodies unchanged without fetching", () => {
    mockContentQuery(() => CMS_ARTICLE);

    render(<ArticleDetailScreen />);

    expect(screen.getByText("Une analyse longue.")).toBeTruthy();
    expect(screen.getByText("Premier paragraphe editorial.")).toBeTruthy();
    expect(screen.getByText("Deuxieme paragraphe editorial.")).toBeTruthy();
    expect(mockFetchArticleBody).not.toHaveBeenCalled();
  });

  it("allows guests to fetch and read public article bodies", async () => {
    let content: ContentDoc | null = { ...WIKI_BASE };
    mockContentQuery(() => content);
    mockFetchArticleBody.mockImplementation(async () => {
      content = { ...WIKI_BASE, articleBody: "Guest-readable full article." };
      return { articleBody: content.articleBody!, fetched: true };
    });

    const { rerender } = render(<ArticleDetailScreen />);

    expect(mockFetchArticleBody).toHaveBeenCalledTimes(1);

    rerender(<ArticleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Guest-readable full article.")).toBeTruthy();
    });
  });
});
