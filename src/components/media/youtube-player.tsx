import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

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
  /** Controlled play flag for the IFrame API wrapper. */
  play?: boolean;
  preferredResumeSeconds?: number | null;
  onTimeUpdate?: (update: YoutubePlayerTimeUpdate) => void;
  onSnapshotChange?: (snapshot: YoutubePlayerSnapshot) => void;
  onReady?: () => void;
  onError?: (error: string) => void;
  testID?: string;
  height: number;
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
    onReady,
    onError,
    testID = "youtube-player",
    height,
    width,
  },
  ref,
) {
  const { theme } = useAppTheme();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const isReadyRef = useRef(false);
  const resumeAppliedRef = useRef(false);
  const [snapshot, setSnapshot] = useState<YoutubePlayerSnapshot>({
    isPlaying: false,
    hasFinished: false,
    isBuffering: false,
  });
  const [isReady, setIsReady] = useState(false);

  const applySnapshot = useCallback(
    (next: YoutubePlayerSnapshot) => {
      setSnapshot(next);
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
      play: () => {
        applySnapshot({ ...snapshot, isPlaying: true, hasFinished: false });
      },
      pause: () => {
        applySnapshot({ ...snapshot, isPlaying: false });
      },
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
    [applySnapshot, snapshot],
  );

  useEffect(() => {
    resumeAppliedRef.current = false;
    isReadyRef.current = false;
    setIsReady(false);
  }, [videoId]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void tryApplyResume();
  }, [isReady, preferredResumeSeconds, tryApplyResume]);

  useEffect(() => {
    if (!isReady || !snapshot.isPlaying) {
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
  }, [isReady, onTimeUpdate, snapshot.isPlaying]);

  const handleReady = () => {
    isReadyRef.current = true;
    setIsReady(true);
    onReady?.();
    void tryApplyResume();
  };

  const handleStateChange = (state: string) => {
    applySnapshot(reduceYoutubePlayerState(snapshot, state));
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceMuted,
          height,
          width: width ?? "100%",
        },
      ]}
      testID={testID}
    >
      <YoutubePlayer
        ref={playerRef}
        height={height}
        width={width}
        videoId={videoId}
        play={play}
        onChangeState={handleStateChange}
        onReady={handleReady}
        onError={(error: string) => onError?.(String(error))}
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
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "100%",
  },
});
