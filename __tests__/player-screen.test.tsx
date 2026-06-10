import { render, screen } from "@testing-library/react-native";

import PlayerScreen from "../app/player/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseQuery = jest.fn();
const mockUsePersistentMediaPlayer = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({ id: "content_1" }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  // No-op in tests — the focus-driven PiP / orientation behaviour is device-only.
  useFocusEffect: () => {},
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayer: () => mockUsePersistentMediaPlayer(),
}));

describe("PlayerScreen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockUsePersistentMediaPlayer.mockReturnValue({
      activeSession: {
        kind: "episode",
        contentId: "content_1",
        title: "L'economie du soin",
        audioUrl: "https://cdn.example.com/episode.mp3",
      },
      closePlayer: jest.fn(),
      currentTimeSeconds: 120,
      durationSeconds: 1800,
      hasFinished: false,
      isPlaying: true,
      playEpisode: jest.fn(),
      playHostedVideo: jest.fn(),
      seekBy: jest.fn(),
      togglePlayback: jest.fn(),
      videoPlayer: null,
    });
  });

  it("renders the fullscreen audio variant for episodes", () => {
    mockUseQuery.mockReturnValue({
      _id: "content_1",
      tenantSlug: "demo-media",
      kind: "episode",
      status: "published",
      title: "L'economie du soin",
      summary: "Entretien long format.",
      category: "Podcast",
      tags: ["podcast"],
      isPremium: false,
      publishedAt: "2026-06-03T09:00:00.000Z",
      durationSeconds: 1800,
      audioUrl: "https://cdn.example.com/episode.mp3",
    });

    render(<PlayerScreen />);

    expect(screen.getByTestId("player-screen-audio")).toBeTruthy();
    expect(screen.getAllByText("L'economie du soin").length).toBeGreaterThan(0);
  });

  it("renders the fullscreen hosted video variant", () => {
    mockUsePersistentMediaPlayer.mockReturnValue({
        activeSession: {
          kind: "hostedVideo",
          contentId: "content_1",
          title: "Film manifeste",
          playbackUrl: "https://cdn.example.com/video.mp4",
        },
        closePlayer: jest.fn(),
        currentTimeSeconds: 120,
        durationSeconds: 1800,
        hasFinished: false,
        isPlaying: true,
        playEpisode: jest.fn(),
        playHostedVideo: jest.fn(),
        seekBy: jest.fn(),
        togglePlayback: jest.fn(),
        videoPlayer: {
          startPictureInPicture: jest.fn(),
        },
    });
    mockUseQuery.mockReturnValue({
      _id: "content_1",
      tenantSlug: "demo-media",
      kind: "video",
      status: "published",
      title: "Film manifeste",
      summary: "Hosted long-form video.",
      category: "Film",
      tags: ["video"],
      isPremium: false,
      publishedAt: "2026-06-03T09:00:00.000Z",
      durationSeconds: 1800,
      videoSource: {
        kind: "hosted",
        uploadKey: "video-1",
        playbackUrl: "https://cdn.example.com/video.mp4",
      },
    });

    render(<PlayerScreen />);

    expect(screen.getByTestId("player-screen-video")).toBeTruthy();
    expect(screen.getByText("Rotate for fullscreen")).toBeTruthy();
  });
});
