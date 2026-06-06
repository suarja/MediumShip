import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_123",
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
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

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

describe("signed-in library screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockOpenPaywall.mockClear();
    await changeAppLanguage("en");
  });

  it("renders the signed-in personal sections instead of the guest gate", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Saved library section")).toBeTruthy();
    expect(screen.queryByText("Upgrade to save items")).toBeNull();
    expect(screen.queryByText("Offline shelf section")).toBeNull();
    expect(screen.getByText("Download to listen without a network")).toBeTruthy();
    expect(screen.getAllByText("Lists")).toHaveLength(1);
    expect(screen.queryByText("Your library, everywhere")).toBeNull();
  });

  it("shows gate badges on saved, lists, and offline section headers", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getAllByText("Premium")).toHaveLength(2);
  });

  it("pressing the lists row opens the lists paywall", () => {
    render(<LibraryScreen />);

    fireEvent.press(screen.getByText("Listen in the car"));

    expect(mockOpenPaywall).toHaveBeenCalledWith("lists");
  });

  it("shows the offline locked promo card copy for non-premium members", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Download to listen without a network")).toBeTruthy();
    expect(screen.queryByText("Become a member")).toBeNull();
  });

  it("pressing the offline locked card opens the offline paywall", () => {
    render(<LibraryScreen />);

    fireEvent.press(screen.getByText("Download to listen without a network"));

    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
  });
});
