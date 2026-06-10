import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { YoutubeInlinePlayer } from "../src/components/media/youtube-inline-player";

const mockSeekTo = jest.fn();
const mockGetCurrentTime = jest.fn().mockResolvedValue(0);
const mockGetDuration = jest.fn().mockResolvedValue(300);

jest.mock("../src/features/media/use-playback-progress", () => ({
  usePlaybackProgress: jest.fn(() => ({
    preferredResumeSeconds: 42,
    saveFinal: jest.fn(),
  })),
}));

jest.mock("../src/features/discovery/use-content-engagement", () => ({
  useContentEngagement: jest.fn(),
}));

jest.mock("react-native-youtube-iframe", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    __esModule: true,
    default: React.forwardRef(
      (
        {
          videoId,
          play,
          onReady,
          onChangeState,
          testID,
        }: {
          videoId: string;
          play?: boolean;
          onReady?: () => void;
          onChangeState?: (state: string) => void;
          testID?: string;
        },
        ref: React.Ref<{
          seekTo: (seconds: number, allowSeekAhead: boolean) => void;
          getCurrentTime: () => Promise<number>;
          getDuration: () => Promise<number>;
        }>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          seekTo: mockSeekTo,
          getCurrentTime: mockGetCurrentTime,
          getDuration: mockGetDuration,
        }));

        React.useEffect(() => {
          onReady?.();
        }, [onReady]);

        return (
          <View testID={testID ?? "mock-youtube-iframe"}>
            <Text accessibilityLabel={`youtube-${videoId}-${play ? "playing" : "paused"}`}>
              {videoId}
            </Text>
            <Pressable
              accessibilityLabel="simulate-pause"
              onPress={() => onChangeState?.("paused")}
            />
            <Pressable
              accessibilityLabel="simulate-play"
              onPress={() => onChangeState?.("playing")}
            />
          </View>
        );
      },
    ),
  };
});

describe("YoutubeInlinePlayer", () => {
  beforeEach(() => {
    mockSeekTo.mockClear();
    mockGetCurrentTime.mockReset().mockResolvedValue(0);
    mockGetDuration.mockReset().mockResolvedValue(300);
  });

  it("autoplays on mount with play=true", () => {
    render(
      <YoutubeInlinePlayer
        canSyncRemote={false}
        contentId="video_1"
        videoId="dQw4w9WgXcQ"
      />,
    );

    expect(screen.getByLabelText("youtube-dQw4w9WgXcQ-playing")).toBeTruthy();
  });

  it("applies preferred resume position once the player is ready", async () => {
    render(
      <YoutubeInlinePlayer
        canSyncRemote={false}
        contentId="video_1"
        videoId="dQw4w9WgXcQ"
      />,
    );

    await waitFor(() => {
      expect(mockSeekTo).toHaveBeenCalledWith(42, true);
    });
  });

  it("derives playing state from the iframe without a parallel play intent", async () => {
    const ref = { current: null as import("../src/components/media/youtube-inline-player").YoutubeInlinePlayerHandle | null };

    render(
      <YoutubeInlinePlayer
        ref={ref}
        canSyncRemote={false}
        contentId="video_1"
        videoId="dQw4w9WgXcQ"
      />,
    );

    expect(screen.getByLabelText("youtube-dQw4w9WgXcQ-playing")).toBeTruthy();
    expect(ref.current?.getIsPlaying()).toBe(false);

    await act(async () => {
      fireEvent.press(screen.getByLabelText("simulate-play"));
    });

    expect(ref.current?.getIsPlaying()).toBe(true);

    await act(async () => {
      fireEvent.press(screen.getByLabelText("simulate-pause"));
    });

    expect(ref.current?.getIsPlaying()).toBe(false);
    // Autoplay stays armed — no separate intent flag toggles the play prop.
    expect(screen.getByLabelText("youtube-dQw4w9WgXcQ-playing")).toBeTruthy();
  });

  it("exposes seek via the player ref", async () => {
    const ref = { current: null as import("../src/components/media/youtube-inline-player").YoutubeInlinePlayerHandle | null };

    render(
      <YoutubeInlinePlayer
        ref={ref}
        canSyncRemote={false}
        contentId="video_1"
        videoId="dQw4w9WgXcQ"
      />,
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    act(() => {
      ref.current?.seekTo(90);
    });

    expect(mockSeekTo).toHaveBeenCalledWith(90, true);
  });
});
