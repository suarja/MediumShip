import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();

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

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn(),
  useQuery: () => ({ name: "Camille Renard", avatarUrl: null }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => "/profile",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_123",
    user: { imageUrl: null },
    email: "camille@example.com",
    fullName: "Camille Renard",
    signOut: jest.fn(),
  }),
}));

const mockUseBookmarks = jest.fn(() => ({
  bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
  isMember: false,
  isMembershipLoading: false,
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => mockUseBookmarks(),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({ downloads: [] }),
}));

jest.mock("../src/features/personal-lists/use-personal-lists", () => ({
  usePersonalLists: () => ({ lists: [] }),
}));

jest.mock("../src/features/history/use-resume", () => ({
  useResume: () => ({
    data: {
      contentId: "content_resume",
      kind: "episode",
      title: "The care economy",
      seconds: 420,
      durationSeconds: 1800,
      progressRatio: 0.23,
    },
    isLoading: false,
  }),
}));

jest.mock("../src/features/history/use-reading-history", () => ({
  useReadingHistory: () => ({
    data: [],
    isLoading: false,
    clearReadingHistory: jest.fn(),
  }),
}));

jest.mock("../src/features/profile/use-avatar-edit", () => ({
  useAvatarEdit: () => ({
    pickAndUploadAvatar: jest.fn(),
    isUploading: false,
    canEditAvatar: true,
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

describe("signed-in profile", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOpenPaywall.mockClear();
    mockPush.mockClear();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
      isMember: false,
      isMembershipLoading: false,
    });
    await changeAppLanguage("en");
  });

  it("renders the identity, stat strip, and library rows from the mockup", () => {
    render(<ProfileScreen />);

    // Top bar title + settings gear
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByTestId("profile-settings-button")).toBeTruthy();

    // Identity name
    expect(screen.getByText("Camille Renard")).toBeTruthy();

    // Three compact stats
    expect(screen.getAllByText("Favorites").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.getByText("History")).toBeTruthy();

    // "My library" nav rows
    expect(screen.getByText("My library")).toBeTruthy();
    expect(screen.getAllByText("Favorites").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Saved items")).toBeNull();

    // The banner-hero composition is gone
    expect(screen.queryByText("Your profile")).toBeNull();
  });

  it("navigates to /lists when a signed-in member taps My lists", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("My lists"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/lists" }),
    );
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });

  it("opens the offline paywall when a non-premium member taps Downloads", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("Downloads"));

    expect(HapticsService.medium).toHaveBeenCalledTimes(1);
    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to /downloads when a premium member taps Downloads", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
      isMember: true,
      isMembershipLoading: false,
    });

    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("Downloads"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/downloads" }),
    );
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });

  it("navigates to /favorites when saved items row is pressed", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getAllByText("Favorites")[1]!);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/favorites" }),
    );
  });

  it("navigates to the resumed media detail when the resume card is pressed", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId("resume-card"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/player/content_resume" }),
    );
  });
});
