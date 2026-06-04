import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import VideoDetailScreen from "../app/video/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseQuery = jest.fn();
const mockClosePlayer = jest.fn();
const mockUseEventListener = jest.fn();

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

jest.mock("expo", () => ({
  useEventListener: (...args: unknown[]) => mockUseEventListener(...args),
}));

describe("video detail", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockClosePlayer.mockClear();
    mockUseEventListener.mockReset();
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

    expect(screen.getByText("Play video")).toBeTruthy();
    expect(mockClosePlayer).not.toHaveBeenCalled();
    expect(screen.getByText("Open on YouTube")).toBeTruthy();

    fireEvent.press(screen.getByTestId("video-start-button"));

    expect(screen.getByTestId("youtube-player")).toBeTruthy();
    expect(mockClosePlayer).toHaveBeenCalledTimes(1);
  });

  it("renders a Picture in Picture action for hosted videos", () => {
    mockUseQuery.mockReturnValue({
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
    });

    render(<VideoDetailScreen />);

    expect(screen.getByText("Play video")).toBeTruthy();

    fireEvent.press(screen.getByTestId("video-start-button"));

    expect(screen.getByTestId("hosted-video-player")).toBeTruthy();
    expect(screen.getByText("Picture in Picture")).toBeTruthy();
    expect(mockClosePlayer).toHaveBeenCalledTimes(1);
  });
});
