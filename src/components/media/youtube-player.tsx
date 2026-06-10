import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import YoutubePlayer, { type YoutubeIframeRef } from "react-native-youtube-iframe";

import {
  decideYoutubeResumeSeek,
  reduceYoutubePlayerState,
  type YoutubePlayerSnapshot,
} from "../../features/media/youtube-player-state";
import { useAppTheme } from "../../features/theme/theme-provider";

const TIME_POLL_INTERVAL_MS = 1000;

export type YoutubePlayerHandle = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
};

export type YoutubePlayerTimeUpdate = {
  currentSeconds: number;
  durationSeconds: number;
};

type YoutubePlayerProps = {
  videoId: string;
  play?: boolean;
  preferredResumeSeconds?: number | null;
  onTimeUpdate?: (update: YoutubePlayerTimeUpdate) => void;
  onSnapshotChange?: (snapshot: YoutubePlayerSnapshot) => void;
  onStateChange?: (playerState: string) => void;
  onReady?: () => void;
  onError?: (error: string) => void;
  testID?: string;
  fill?: boolean;
  height?: number;
  width?: number;
};

export const YoutubePlayerSurface = forwardRef<
  YoutubePlayerHandle,
  YoutubePlayerProps
>(function YoutubePlayerSurface(
  {
    videoId,
    play = false,
    preferredResumeSeconds = null,
    onTimeUpdate,
    onSnapshotChange,
    onStateChange,
    onReady,
    onError,
    testID = "youtube-player",
    fill = false,
    height = 200,
    width,
  },
  ref,
) {
  const { theme } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const isReadyRef = useRef(false);
  const resumeAppliedRef = useRef(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  const applySnapshot = useCallback(
    (next: YoutubePlayerSnapshot) => {
      onSnapshotChange?.(next);
    },
    [onSnapshotChange],
  );

  const tryApplyResume = useCallback(async () => {
    const iframe = playerRef.current;
    if (!iframe || !isReadyRef.current) {
      return;
    }

    const currentSeconds = await iframe.getCurrentTime().catch(() => 0);
    const decision = decideYoutubeResumeSeek({
      preferredResumeSeconds,
      currentSeconds,
      resumeAlreadyApplied: resumeAppliedRef.current,
    });

    if (decision.action === "skip") {
      if (decision.reason === "at-target") {
        resumeAppliedRef.current = true;
      }
      return;
    }

    resumeAppliedRef.current = true;
    iframe.seekTo(decision.targetSeconds, true);
  }, [preferredResumeSeconds]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {},
      pause: () => {},
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
      },
      getCurrentTime: async () => {
        return (await playerRef.current?.getCurrentTime()) ?? 0;
      },
      getDuration: async () => {
        return (await playerRef.current?.getDuration()) ?? 0;
      },
    }),
    [],
  );

  useEffect(() => {
    resumeAppliedRef.current = false;
    isReadyRef.current = false;
    setIsPlayerReady(false);
  }, [videoId]);

  useEffect(() => {
    if (!isPlayerReady) {
      return;
    }
    void tryApplyResume();
  }, [isPlayerReady, preferredResumeSeconds, tryApplyResume]);

  useEffect(() => {
    if (!isPlayerReady || !play) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const iframe = playerRef.current;
      if (!iframe || cancelled) {
        return;
      }

      const [currentSeconds, durationSeconds] = await Promise.all([
        iframe.getCurrentTime().catch(() => 0),
        iframe.getDuration().catch(() => 0),
      ]);

      if (!cancelled) {
        onTimeUpdate?.({
          currentSeconds,
          durationSeconds: durationSeconds > 0 ? durationSeconds : 0,
        });
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, TIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isPlayerReady, onTimeUpdate, play, videoId]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    if (nextWidth > 0 && nextHeight > 0) {
      setLayoutSize({ width: nextWidth, height: nextHeight });
    }
  };

  const handleReady = () => {
    isReadyRef.current = true;
    setIsPlayerReady(true);
    onReady?.();
    void tryApplyResume();
  };

  const handleStateChange = (state: string) => {
    applySnapshot(
      reduceYoutubePlayerState(
        { isPlaying: false, hasFinished: false, isBuffering: false },
        state,
      ),
    );
    onStateChange?.(state);
  };

  const fallbackWidth = width ?? windowWidth;
  const fallbackHeight = fill
    ? Math.round((fallbackWidth * 9) / 16)
    : height;
  const playerWidth = fill
    ? layoutSize.width > 0
      ? layoutSize.width
      : fallbackWidth
    : width ?? (layoutSize.width > 0 ? layoutSize.width : 320);
  const playerHeight = fill
    ? layoutSize.height > 0
      ? layoutSize.height
      : fallbackHeight
    : height;

  return (
    <View
      onLayout={fill ? handleLayout : undefined}
      style={[
        styles.container,
        fill ? styles.fill : { height, width: width ?? "100%" },
        !fill && { backgroundColor: theme.colors.surfaceMuted },
      ]}
      testID={testID}
    >
      <YoutubePlayer
        ref={playerRef}
        height={playerHeight}
        width={playerWidth}
        videoId={videoId}
        // Drive play from the prop directly. The library already gates the
        // playVideo postMessage on its *own* `playerReady`, so an extra local
        // `isPlayerReady &&` gate only desyncs the prop and stalls autostart.
        // (Note: `initialPlayerParams.autoplay` is ignored by the lib — it does
        // not read an `autoplay` key — so the play prop is the only start path.)
        play={play}
        onChangeState={handleStateChange}
        onReady={handleReady}
        onError={(error: string) => onError?.(String(error))}
        forceAndroidAutoplay
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          scrollEnabled: false,
        }}
        initialPlayerParams={{
          controls: true,
          preventFullScreen: false,
          rel: false,
          modestbranding: true,
          playsinline: true,
        }}
        webViewStyle={styles.webView}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  fill: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  webView: {
    opacity: 0.99,
  },
});
