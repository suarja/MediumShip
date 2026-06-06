import { render, screen, fireEvent } from "@testing-library/react-native";

import { ContentActionsBar } from "../src/components/content/content-actions-bar";
import type { ContentDoc } from "../src/features/content/types";
import { initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    isMember: false,
    isMembershipLoading: false,
    isBookmarksLoading: false,
    toggleBookmark: jest.fn(),
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

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

const mockEpisode: ContentDoc = {
  _id: "ep1",
  tenantSlug: "demo-media",
  kind: "episode",
  status: "published",
  title: "Test episode",
  summary: "Test summary",
  category: "Podcasts",
  tags: [],
  isPremium: false,
  audioUrl: "https://example.com/audio.mp3",
};

describe("ContentActionsBar offline paywall trigger", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockOpenPaywall.mockClear();
  });

  it("opens offline paywall when non-member taps download", () => {
    render(<ContentActionsBar content={mockEpisode} />);

    const downloadBtns = screen.getAllByText(/Download|Telecharger/i);
    fireEvent.press(downloadBtns[0]);
    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
  });
});
