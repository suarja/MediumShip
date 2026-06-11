import { forwardRef, useImperativeHandle } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

// Web-only stub: the native inline player depends on `react-native-webview`,
// which has no web build and breaks the web bundle. The web bundle is only used
// for headless visual-testing of layout (see docs/agents/ui-visual-testing.md),
// never for real YouTube playback, so a no-op placeholder is sufficient here.

export type YoutubeInlinePlayerHandle = {
  seekTo: (seconds: number) => void;
  getIsPlaying: () => boolean;
};

export type YoutubeInlinePlayerProps = {
  contentId: string;
  videoId: string;
  durationSeconds?: number;
  canSyncRemote: boolean;
  title?: string;
  subtitle?: string;
  summary?: string;
  launchUrl?: string;
  foregroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const YoutubeInlinePlayer = forwardRef<
  YoutubeInlinePlayerHandle,
  YoutubeInlinePlayerProps
>(function YoutubeInlinePlayer({ style, testID = "youtube-inline-player" }, ref) {
  useImperativeHandle(ref, () => ({
    seekTo: () => {},
    getIsPlaying: () => false,
  }));

  return <View style={style} testID={testID} />;
});
