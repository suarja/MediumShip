import { fireEvent, render, screen } from "@testing-library/react-native";

import { ContentActionsSheet } from "../src/components/content/content-actions-sheet";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockRecordInteraction = jest.fn();
const mockOnDismiss = jest.fn();

const SAMPLE_CONTENT = {
  _id: "article-1",
  tenantSlug: "demo-media",
  kind: "article",
  status: "published",
  title: "Economie du soin",
  summary: "Une analyse",
  category: "Analyse",
  tags: [],
  isPremium: false,
};

jest.mock("convex/react", () => ({
  useMutation: () => mockRecordInteraction,
  useQuery: (_api: unknown, args: unknown) => {
    if (args === "skip") {
      return undefined;
    }
    if (args && typeof args === "object" && "contentId" in args) {
      return [];
    }
    return SAMPLE_CONTENT;
  },
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    toggleBookmark: jest.fn(),
    isBookmarksLoading: false,
  }),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({
    downloadedItem: null,
    isLoading: false,
    isDownloading: false,
    downloadContent: jest.fn(),
  }),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: true, isLoading: false }),
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

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    tenantSlug: "demo-media",
    enabledModules: ["articles", "discover", "bookmarks", "offline", "personalLists"],
    theme: {
      colors: {
        heading: "#000",
        textMuted: "#666",
        border: "#eee",
        surface: "#fff",
        accent: "#00f",
        premium: "#c9a227",
        canvas: "#fff",
      },
      radii: { xl: 16, md: 8, pill: 99 },
      spacing: { md: 12 },
      isDark: false,
    },
  }),
}));

describe("ContentActionsSheet discovery focus", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRecordInteraction.mockClear();
    mockOnDismiss.mockClear();
    await changeAppLanguage("fr");
  });

  it('shows "Pas intéressé" and records hide before dismissing', () => {
    render(
      <ContentActionsSheet
        visible
        contentId={"article-1" as never}
        focus="discovery"
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.press(screen.getByTestId("discover-hide-action"));

    expect(screen.getByText("Pas intéressé")).toBeTruthy();
    expect(mockRecordInteraction).toHaveBeenCalledWith({
      tenantSlug: "demo-media",
      contentId: "article-1",
      type: "hide",
    });
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(HapticsService.warning).toHaveBeenCalledTimes(1);
  });
});
