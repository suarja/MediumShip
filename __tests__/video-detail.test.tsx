import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import * as WebBrowser from "expo-web-browser";
import { api } from "../convex/_generated/api";
import VideoDetailScreen from "../app/video/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseQuery = jest.fn();
const mockUseEventListener = jest.fn();
const mockPush = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({ id: "video_1" }),
  useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
  usePathname: () => "/video/video_1",
  useGlobalSearchParams: () => ({}),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayer: () => ({
    activeSession: null,
    closePlayer: jest.fn(),
  }),
  usePersistentMediaPlayerSpace: () => 0,
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

jest.mock("expo", () => ({
  useEventListener: (...args: unknown[]) => mockUseEventListener(...args),
}));

describe("video detail", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockPush.mockClear();
    mockUseEventListener.mockReset();
  });

  it("launches youtube inline and keeps an external fallback", () => {
    mockUseQuery.mockImplementation((queryRef: unknown, args: unknown) => {
      if (args === "skip") {
        return undefined;
      }
      if (queryRef === api.personalLists.queries.listMineForContent) {
        return [];
      }

      return {
        _id: "video_1",
        tenantSlug: "demo-media",
        kind: "video",
        status: "published",
        title: "Debat social",
        summary: "Conversation long format.",
        category: "Debat",
        tags: ["video"],
        isPremium: false,
        publishedAt: "2026-06-03T09:00:00.000Z",
        videoSource: {
          kind: "youtube",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          youtubeVideoId: "dQw4w9WgXcQ",
        },
      };
    });

    render(<VideoDetailScreen />);

    expect(screen.getByLabelText("Play video")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Play video"));

    expect(screen.getByTestId("youtube-player")).toBeTruthy();
    expect(screen.getByText("Open on YouTube")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it("opens the dedicated player route for hosted videos", async () => {
    mockUseQuery.mockImplementation((queryRef: unknown, args: unknown) => {
      if (args === "skip") {
        return undefined;
      }
      if (queryRef === api.personalLists.queries.listMineForContent) {
        return [];
      }

      return {
        _id: "video_2",
        tenantSlug: "demo-media",
        kind: "video",
        status: "published",
        title: "Film manifeste",
        summary: "Hosted long-form video.",
        category: "Film",
        tags: ["video"],
        isPremium: false,
        publishedAt: "2026-06-03T10:00:00.000Z",
        videoSource: {
          kind: "hosted",
          uploadKey: "video-asset-1",
          playbackUrl: "https://cdn.example.com/video.mp4",
        },
      };
    });

    render(<VideoDetailScreen />);

    expect(screen.getByLabelText("Play video")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Play video"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/player/video_2");
    });
  });
});
