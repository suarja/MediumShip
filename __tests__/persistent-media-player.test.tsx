import { Pressable, Text, View } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import {
  PersistentMediaPlayerProvider,
  usePersistentMediaPlayer,
} from "../src/features/media/persistent-media-player";

const mockPush = jest.fn();
const mockConvexUseQuery = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useSegments: () => ["(app)"],
}));

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: (...args: unknown[]) => mockConvexUseQuery(...args),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

function Harness() {
  const {
    activeSession,
    closePlayer,
    openPlayer,
    playEpisode,
    playHostedVideo,
  } = usePersistentMediaPlayer();

  return (
    <View>
      <Text>{activeSession ? `${activeSession.kind}:${activeSession.contentId}` : "idle"}</Text>
      <Pressable
        onPress={() =>
          void playEpisode({
            contentId: "episode_1",
            title: "Episode one",
            audioUrl: "https://cdn.example.com/episode.mp3",
            durationSeconds: 1800,
          })
        }
      >
        <Text>play episode</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          void playHostedVideo({
            contentId: "video_1",
            title: "Video one",
            playbackUrl: "https://cdn.example.com/video.mp4",
            durationSeconds: 1200,
          })
        }
      >
        <Text>play hosted</Text>
      </Pressable>
      <Pressable onPress={openPlayer}>
        <Text>open player</Text>
      </Pressable>
      <Pressable onPress={closePlayer}>
        <Text>close</Text>
      </Pressable>
    </View>
  );
}

describe("PersistentMediaPlayerProvider", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockConvexUseQuery.mockReturnValue(undefined);
  });

  it("replaces an active episode session with a hosted video session", async () => {
    render(
      <PersistentMediaPlayerProvider>
        <Harness />
      </PersistentMediaPlayerProvider>,
    );

    expect(screen.getByText("idle")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText("play episode"));
    });

    await waitFor(() => {
      expect(screen.getByText("episode:episode_1")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("play hosted"));
    });

    await waitFor(() => {
      expect(screen.getByText("hostedVideo:video_1")).toBeTruthy();
    });
  });

  it("opens the canonical player route for the active session", async () => {
    render(
      <PersistentMediaPlayerProvider>
        <Harness />
      </PersistentMediaPlayerProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText("play hosted"));
    });

    fireEvent.press(screen.getByText("open player"));

    expect(mockPush).toHaveBeenCalledWith("/player/video_1");
  });
});
