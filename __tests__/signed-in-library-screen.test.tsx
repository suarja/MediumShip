import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/library",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
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

const mockUseIsMember = jest.fn(() => ({ isMember: false, isLoading: false }));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => mockUseIsMember(),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

jest.mock("../src/features/personal-lists/use-personal-lists", () => ({
  usePersonalLists: () => ({
    lists: [],
    primaryList: null,
    previewCoverUrls: [],
    isListsLoading: false,
  }),
}));

describe("signed-in library screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockOpenPaywall.mockClear();
    mockPush.mockClear();
    mockUseIsMember.mockReturnValue({ isMember: false, isLoading: false });
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

  it("navigates to the full favorites list when See all is pressed", () => {
    render(<LibraryScreen />);

    fireEvent.press(screen.getAllByLabelText("See all")[0]);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/favorites" }),
    );
  });

  it("navigates to the full downloads list from the offline section", () => {
    mockUseIsMember.mockReturnValue({ isMember: true, isLoading: false });

    render(<LibraryScreen />);

    fireEvent.press(screen.getAllByLabelText("See all")[1]);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/downloads" }),
    );
  });

  it("does not render a top-bar search loupe", () => {
    render(<LibraryScreen />);

    expect(screen.queryByTestId("library-top-bar-search")).toBeNull();
  });

  it("labels the saved section Favorites without a free gate badge", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Favorites")).toBeTruthy();
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByText("Free")).toBeNull();
    expect(screen.getAllByText("Premium")).toHaveLength(2);
  });

  it("pressing the lists row opens the lists screen for signed-in members", () => {
    render(<LibraryScreen />);

    fireEvent.press(screen.getByLabelText("Listen in the car"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/lists" }),
    );
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });

  it("pressing the lists row still opens the lists screen for premium members", () => {
    mockUseIsMember.mockReturnValue({ isMember: true, isLoading: false });

    render(<LibraryScreen />);

    fireEvent.press(screen.getByLabelText("Listen in the car"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/lists" }),
    );
    expect(mockOpenPaywall).not.toHaveBeenCalled();
    expect(screen.getByText("Offline shelf section")).toBeTruthy();
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
