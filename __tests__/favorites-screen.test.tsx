import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import FavoritesScreen from "../app/(app)/favorites";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { ContentDoc } from "../src/features/content/types";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
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

const sampleContent = {
  _id: "article-1",
  kind: "article",
  title: "Care economy deep dive",
  category: "Analyses",
  isPremium: false,
  coverImageUrl: "https://example.com/cover.jpg",
} as unknown as ContentDoc;

const mockUseBookmarks = jest.fn(() => ({
  bookmarks: [{ content: sampleContent, createdAt: 1 }],
  isMember: false,
  isMembershipLoading: false,
  isBookmarksLoading: false,
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => mockUseBookmarks(),
}));

describe("favorites screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockUseClerkAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ content: sampleContent, createdAt: 1 }],
      isMember: false,
      isMembershipLoading: false,
      isBookmarksLoading: false,
    });
    await changeAppLanguage("en");
  });

  it("lists all favorites for signed-in members", () => {
    render(<FavoritesScreen />);

    expect(screen.getByText("All favorites")).toBeTruthy();
    expect(screen.getByText("Care economy deep dive")).toBeTruthy();
  });

  it("shows a sign-in affordance for guests", () => {
    mockUseClerkAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
    mockUseBookmarks.mockReturnValue({
      bookmarks: [],
      isMember: false,
      isMembershipLoading: false,
      isBookmarksLoading: false,
    });

    render(<FavoritesScreen />);

    expect(screen.getByText("Keep what deserves a return visit")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
  });

  it("navigates back from the top bar", () => {
    render(<FavoritesScreen />);

    fireEvent.press(screen.getByLabelText("Back"));

    expect(mockBack).toHaveBeenCalled();
  });
});
