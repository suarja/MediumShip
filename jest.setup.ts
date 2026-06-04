process.env.EXPO_PUBLIC_CONVEX_URL ??= "https://example.convex.cloud";
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??= "pk_test_mock";
process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??= "https://example.convex.site";
process.env.EXPO_PUBLIC_EMBED_REFERER_URL ??= "https://example.mediumship.app";

// Default Clerk auth state for component tests: a guest. Screens/components that
// read auth (e.g. the premium paywall) get a sane default here; tests that need
// a signed-in user override this module locally with their own jest.mock.
jest.mock("./src/features/auth/use-clerk-auth", () => ({
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

jest.mock("expo-audio", () => ({
  createAudioPlayer: () => ({
    remove: jest.fn(),
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
  }),
  setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioPlayer: () => ({
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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
  const mockVideoPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    currentTime: 0,
    showNowPlayingNotification: false,
    staysActiveInBackground: false,
    timeUpdateEventInterval: 0,
    startPictureInPicture: jest.fn().mockResolvedValue(undefined),
  };

  return {
    isPictureInPictureSupported: () => true,
    useVideoPlayer: () => mockVideoPlayer,
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

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: "opened" }),
}));

jest.mock("expo-screen-orientation", () => ({
  lockAsync: jest.fn().mockResolvedValue(undefined),
  unlockAsync: jest.fn().mockResolvedValue(undefined),
  addOrientationChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  removeOrientationChangeListener: jest.fn(),
  Orientation: {
    PORTRAIT_UP: 1,
    LANDSCAPE_LEFT: 3,
    LANDSCAPE_RIGHT: 4,
  },
  OrientationLock: {
    PORTRAIT_UP: 2,
  },
}));

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    WebView: ({ testID }: { testID?: string }) =>
      React.createElement(View, { testID }),
  };
});
