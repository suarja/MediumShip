jest.mock("expo-audio", () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioPlayer: () => ({
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

jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    useVideoPlayer: () => ({}),
    VideoView: ({ testID }: { testID?: string }) =>
      React.createElement(View, { testID }),
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
