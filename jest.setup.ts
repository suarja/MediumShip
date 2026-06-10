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

// Default member entitlement for feature-access gates. Override locally when a
// test needs a guest or loading membership state.
jest.mock("./src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: true, isLoading: false }),
}));

// Default paywall sheet mock for component tests. Tests that want to assert on
// openPaywall calls override this locally with their own jest.mock.
jest.mock("./src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({
    openPaywall: jest.fn(),
    closePaywall: jest.fn(),
  }),
  PaywallSheetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("./src/features/content/content-actions-sheet-provider", () => ({
  useContentActionsSheet: () => ({
    openContentActions: jest.fn(),
    closeContentActions: jest.fn(),
  }),
  ContentActionsSheetProvider: ({ children }: { children: React.ReactNode }) => children,
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
      ({ testID }: { testID?: string }, ref: React.Ref<unknown>) => {
        React.useImperativeHandle(ref, () => ({
          startPictureInPicture: jest.fn().mockResolvedValue(undefined),
          stopPictureInPicture: jest.fn().mockResolvedValue(undefined),
          enterFullscreen: jest.fn().mockResolvedValue(undefined),
          exitFullscreen: jest.fn().mockResolvedValue(undefined),
        }));

        return React.createElement(View, { testID });
      },
    ),
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Error: "error",
    Warning: "warning",
  },
}));

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
    PORTRAIT_DOWN: 2,
    LANDSCAPE_LEFT: 3,
    LANDSCAPE_RIGHT: 4,
  },
  OrientationLock: {
    PORTRAIT_UP: 2,
  },
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Icon = ({ name, testID }: { name?: string; testID?: string }) =>
    React.createElement(Text, { testID }, name ?? "icon");

  return {
    Ionicons: Icon,
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

jest.mock("react-native-youtube-iframe", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: React.forwardRef(
      (
        {
          videoId,
          onReady,
          testID,
        }: {
          videoId: string;
          onReady?: () => void;
          testID?: string;
        },
        ref: React.Ref<{
          seekTo: (seconds: number, allowSeekAhead: boolean) => void;
          getCurrentTime: () => Promise<number>;
          getDuration: () => Promise<number>;
        }>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          seekTo: jest.fn(),
          getCurrentTime: jest.fn().mockResolvedValue(0),
          getDuration: jest.fn().mockResolvedValue(300),
        }));

        React.useEffect(() => {
          onReady?.();
        }, [onReady]);

        return React.createElement(View, {
          testID: testID ?? "mock-youtube-iframe",
          accessibilityLabel: `youtube-${videoId}`,
        });
      },
    ),
  };
});
