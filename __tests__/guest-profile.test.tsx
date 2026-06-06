import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    user: null,
    email: null,
    fullName: null,
    signOut: jest.fn(),
  }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    isMember: false,
    isMembershipLoading: false,
  }),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({ downloads: [] }),
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

describe("guest profile", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockOpenPaywall.mockClear();
    await changeAppLanguage("en");
  });

  it("renders the gate-screen copy from guestBio with profile CTAs", () => {
    render(<ProfileScreen />);

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Create your profile.")).toBeTruthy();
    expect(
      screen.getByText(
        "Reading stays open. Create an account to save favourite formats and sync progress. Premium adds offline access and personal lists.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        "Your profile now focuses on identity, account state, and settings. Saved items and offline copies live in Library.",
      ),
    ).toBeNull();

    expect(screen.getByTestId("profile-create-account-button")).toBeTruthy();
    expect(screen.getByTestId("profile-discover-premium-button")).toBeTruthy();
    expect(screen.getAllByText("Create an account").length).toBeGreaterThan(0);
    expect(screen.getByText("Discover Premium")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-discover-premium-button"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("support");

    expect(screen.queryByText("Your profile")).toBeNull();
    expect(screen.queryByText("Saved library")).toBeNull();
    expect(screen.queryByText("Offline shelf")).toBeNull();
  });
});
