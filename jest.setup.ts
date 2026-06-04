process.env.EXPO_PUBLIC_CONVEX_URL ??= "https://example.convex.cloud";
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??= "pk_test_mock";
process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??= "https://example.convex.site";
process.env.EXPO_PUBLIC_EMBED_REFERER_URL ??= "https://example.mediumship.app";

jest.mock("expo-audio", () => ({
  createAudioPlayer: () => ({
    remove: jest.fn(),
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioPlayer: () => ({
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  }),
  useAudioPlayerStatus: () => ({
    currentTime: 0,
    didJustFinish: false,
    duration: 180,
    error: null,
    id: "audio-player",
    isBuffering: false,
    isLive: false,
    isLoaded: true,
    loop: false,
    currentOffsetFromLive: null,
    mediaServicesDidReset: false,
    mute: false,
    playbackRate: 1,
    playbackState: "ready",
    playing: false,
    reasonForWaitingToPlay: "",
    shouldCorrectPitch: true,
    timeControlStatus: "paused",
  }),
}));

jest.mock("expo", () => {
  const actualExpo = jest.requireActual("expo");

  return {
    ...actualExpo,
    useEventListener: jest.fn(),
  };
});

jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    isPictureInPictureSupported: () => true,
    useVideoPlayer: () => ({}),
    VideoView: React.forwardRef(
      ({ testID }: { testID?: string }, ref: React.Ref<{ startPictureInPicture: () => Promise<void> }>) => {
        React.useImperativeHandle(ref, () => ({
          startPictureInPicture: jest.fn().mockResolvedValue(undefined),
        }));

        return React.createElement(View, { testID });
      },
    ),
  };
});

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    WebView: ({ testID }: { testID?: string }) =>
      React.createElement(View, { testID }),
  };
});
