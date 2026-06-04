import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import VideoDetailScreen from "../app/video/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseQuery = jest.fn();
const mockClosePlayer = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({ id: "video_1" }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
}));

jest.mock("../src/features/media/persistent-episode-player", () => ({
  usePersistentEpisodePlayer: () => ({ closePlayer: mockClosePlayer }),
  usePersistentEpisodePlayerSpace: () => 0,
}));

describe("video detail", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockClosePlayer.mockClear();
  });

  it("renders an inline youtube player and keeps an external fallback", () => {
    mockUseQuery.mockReturnValue({
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
    });

    render(<VideoDetailScreen />);

    expect(mockClosePlayer).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("youtube-player")).toBeTruthy();
    expect(screen.getByText("Open on YouTube")).toBeTruthy();
  });
});
