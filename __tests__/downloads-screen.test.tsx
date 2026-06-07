import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import DownloadsScreen from "../app/(app)/downloads";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { ContentDoc } from "../src/features/content/types";

const mockBack = jest.fn();
const mockOpenPaywall = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
  };
});

const mockUseClerkAuth = jest.fn(() => ({
  isLoaded: true,
  isSignedIn: true,
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => mockUseClerkAuth(),
}));

const mockUseIsMember = jest.fn(() => ({
  isMember: true,
  isLoading: false,
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => mockUseIsMember(),
}));

const sampleContent = {
  _id: "episode-1",
  kind: "episode",
  title: "Care economy episode",
  category: "Podcasts",
  isPremium: false,
} as unknown as ContentDoc;

const mockUseDownloads = jest.fn(() => ({
  downloads: [
    {
      content: sampleContent,
      downloadedAt: 1,
      localCoverImagePath: undefined,
    },
  ],
  isLoading: false,
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => mockUseDownloads(),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

describe("downloads screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockBack.mockClear();
    mockOpenPaywall.mockClear();
    mockUseClerkAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseIsMember.mockReturnValue({
      isMember: true,
      isLoading: false,
    });
    mockUseDownloads.mockReturnValue({
      downloads: [
        {
          content: sampleContent,
          downloadedAt: 1,
          localCoverImagePath: undefined,
        },
      ],
      isLoading: false,
    });
    await changeAppLanguage("en");
  });

  it("lists all downloads for premium members", () => {
    render(<DownloadsScreen />);

    expect(screen.getByText("All downloads")).toBeTruthy();
    expect(screen.getByText("Care economy episode")).toBeTruthy();
  });

  it("shows the offline paywall promo for non-premium members", () => {
    mockUseIsMember.mockReturnValue({
      isMember: false,
      isLoading: false,
    });

    render(<DownloadsScreen />);

    expect(screen.getByText("Download to listen without a network")).toBeTruthy();
    fireEvent.press(screen.getByText("Download to listen without a network"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
  });

  it("shows a sign-in affordance for guests", () => {
    mockUseClerkAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
    mockUseIsMember.mockReturnValue({
      isMember: false,
      isLoading: false,
    });
    mockUseDownloads.mockReturnValue({
      downloads: [],
      isLoading: false,
    });

    render(<DownloadsScreen />);

    expect(screen.getByText("Offline copies arrive with the account")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
  });
});
