import { act, render, waitFor } from "@testing-library/react-native";

import { YoutubePlayerSurface } from "../src/components/media/youtube-player";

const mockSeekTo = jest.fn();
const mockGetCurrentTime = jest.fn().mockResolvedValue(0);
const mockGetDuration = jest.fn().mockResolvedValue(300);

jest.mock("react-native-youtube-iframe", () => {
  const React = require("react");
  const { View } = require("react-native");

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
          // Call once on mount — the real iframe fires onReady a single time.
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return (
          <View
            accessibilityLabel={`youtube-${videoId}-${play ? "playing" : "paused"}`}
            testID={testID ?? "mock-youtube-iframe"}
            onTouchEnd={() => onChangeState?.("playing")}
          />
        );
      },
    ),
  };
});

describe("YoutubePlayerSurface", () => {
  beforeEach(() => {
    mockSeekTo.mockClear();
    mockGetCurrentTime.mockReset().mockResolvedValue(0);
    mockGetDuration.mockReset().mockResolvedValue(300);
  });

  it("renders the iframe wrapper for a video id", () => {
    const { getByTestId } = render(
      <YoutubePlayerSurface height={200} videoId="dQw4w9WgXcQ" />,
    );

    expect(getByTestId("youtube-player")).toBeTruthy();
  });

  it("seeks to the preferred resume position once on ready", async () => {
    render(
      <YoutubePlayerSurface
        height={200}
        play
        preferredResumeSeconds={42}
        videoId="dQw4w9WgXcQ"
      />,
    );

    await waitFor(() => {
      expect(mockSeekTo).toHaveBeenCalledWith(42, true);
    });
  });

});
