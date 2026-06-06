import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn(),
  useQuery: () => ({ name: "Camille Renard", avatarUrl: null }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
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
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.getByText("History")).toBeTruthy();

    // "My library" nav rows
    expect(screen.getByText("My library")).toBeTruthy();
    expect(screen.getByText("Saved items")).toBeTruthy();

    // The banner-hero composition is gone
    expect(screen.queryByText("Your profile")).toBeNull();
  });

  it("opens the lists paywall when a non-premium member taps My lists", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("My lists"));

    expect(mockOpenPaywall).toHaveBeenCalledWith("lists");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens the offline paywall when a non-premium member taps Downloads", () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("Downloads"));

    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to /lists when a premium member taps My lists", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
      isMember: true,
      isMembershipLoading: false,
    });

    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("My lists"));

    expect(mockPush).toHaveBeenCalledWith("/lists");
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });

  it("navigates to /library when a premium member taps Downloads", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
      isMember: true,
      isMembershipLoading: false,
    });

    render(<ProfileScreen />);

    fireEvent.press(screen.getByText("Downloads"));

    expect(mockPush).toHaveBeenCalledWith("/library");
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });
});
