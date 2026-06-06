import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => jest.fn(),
  useQuery: () => ({ name: "Camille Renard", avatarUrl: null }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [{ content: {}, createdAt: 1 }, { content: {}, createdAt: 2 }],
    isMember: false,
    isMembershipLoading: false,
  }),
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

describe("signed-in profile", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
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
});
