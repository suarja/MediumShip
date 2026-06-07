import { fireEvent, render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import CommunityScreen from "../app/(app)/community";
import { ContentActionsBar } from "../src/components/content/content-actions-bar";
import type { ContentDoc } from "../src/features/content/types";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseAppTheme = jest.fn();
const mockOpenPaywall = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [{ content: { _id: "a1", title: "Care economy", kind: "article", category: "News", isPremium: false } }],
    isMember: true,
    isMembershipLoading: false,
    isBookmarksLoading: false,
    toggleBookmark: jest.fn(),
  }),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({
    downloadedItem: null,
    downloads: [],
    isLoading: false,
    isDownloading: false,
    downloadContent: jest.fn(),
  }),
}));

jest.mock("../src/features/personal-lists/use-personal-lists", () => ({
  usePersonalLists: () => ({
    lists: [],
    primaryList: null,
    isListsLoading: false,
  }),
}));

const mockUseIsMember = jest.fn(() => ({ isMember: true, isLoading: false }));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => mockUseIsMember(),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("../src/components/library/resume-card", () => ({
  ResumeCard: () => null,
}));

jest.mock("../src/components/library/saved-library-section", () => {
  const { Text } = require("react-native");
  return {
    SavedLibrarySection: () => <Text>Saved library section</Text>,
  };
});

jest.mock("../src/components/library/downloaded-library-section", () => {
  const { Text } = require("react-native");
  return {
    DownloadedLibrarySection: () => <Text>Offline shelf section</Text>,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ bottom: 0 }),
  };
});

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("convex/react", () => ({
  useQuery: () => [],
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

const mockArticle: ContentDoc = {
  _id: "article_1",
  tenantSlug: "demo-media",
  kind: "article",
  status: "published",
  title: "The care economy",
  summary: "Summary",
  category: "Analysis",
  tags: [],
  isPremium: false,
};

function makeTheme(enabledModules: string[]) {
  const featureConfigs = resolveEffectiveFeatureConfigs({ enabledModules });
  if (featureConfigs.community?.enabled) {
    featureConfigs.community = { ...featureConfigs.community, access: "free" };
  }

  return {
    tenantSlug: "demo-media",
    enabledModules,
    featureConfigs,
    feedSections: [],
    theme: {
      colors: {
        heading: "#000",
        text: "#000",
        textMuted: "#666",
        border: "#eee",
        surface: "#fff",
        canvas: "#fff",
        canvasAccent: "#f2f2f2",
        accent: "#0000ff",
        accentContrast: "#fff",
        premium: "#aa6600",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 20, xxl: 28 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
      isDark: false,
    },
  };
}

const ALL_CAPS = [
  "articles",
  "episodes",
  "videos",
  "premium",
  "collections",
  "agenda",
  "community",
  "bookmarks",
  "progressSync",
  "offline",
  "personalLists",
  "membersRoom",
];

describe("capability gates", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockOpenPaywall.mockClear();
    mockUseIsMember.mockReturnValue({ isMember: true, isLoading: false });
    mockUseAppTheme.mockReturnValue(makeTheme(ALL_CAPS));
  });

  it("shows bookmark, offline, and list pills when capabilities are enabled", () => {
    render(<ContentActionsBar content={mockArticle} />);

    expect(screen.getByText("Keep")).toBeTruthy();
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.getByText("List")).toBeTruthy();
  });

  it("hides member capability pills when capabilities are disabled", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme(
        ALL_CAPS.filter(
          (cap) => cap !== "bookmarks" && cap !== "offline" && cap !== "personalLists",
        ),
      ),
    );

    render(<ContentActionsBar content={mockArticle} />);

    expect(screen.queryByText("Keep")).toBeNull();
    expect(screen.queryByText("Offline")).toBeNull();
    expect(screen.queryByText("List")).toBeNull();
  });

  it("hides saved, lists, and offline library sections when capabilities are off", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme(
        ALL_CAPS.filter(
          (cap) => cap !== "bookmarks" && cap !== "personalLists" && cap !== "offline",
        ),
      ),
    );

    render(<LibraryScreen />);

    expect(screen.queryByText("Saved library section")).toBeNull();
    expect(screen.queryByText("Lists")).toBeNull();
    expect(screen.queryByText("Offline shelf section")).toBeNull();
  });

  it("shows library capability sections when enabled", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Saved library section")).toBeTruthy();
    expect(screen.getAllByText("Lists").length).toBeGreaterThan(0);
    expect(screen.getByText("Offline shelf section")).toBeTruthy();
  });

  it("hides the members room card when membersRoom is disabled", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme(ALL_CAPS.filter((cap) => cap !== "membersRoom")),
    );

    render(<CommunityScreen />);

    expect(screen.queryByText("Salon membres")).toBeNull();
    expect(screen.getByText("Discord communautaire")).toBeTruthy();
  });

  it("shows the members room card when membersRoom is enabled", () => {
    mockUseIsMember.mockReturnValue({ isMember: false, isLoading: false });

    render(<CommunityScreen />);

    expect(screen.getByText("Salon membres")).toBeTruthy();
    fireEvent.press(screen.getByText("Salon membres"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("members");
  });
});
