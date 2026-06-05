import { MutableRefObject, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { useSegments } from "expo-router";
import { VideoView, type VideoPlayer } from "expo-video";

import { resolvePipStopAction } from "./video-pip";

type VideoPipHostProps = {
  /** The shared hosted-video player, or null when none is active. */
  player: VideoPlayer | null;
  /** True while a hosted-video session is active. */
  active: boolean;
  /** Whether the video is currently playing (drives "float when away"). */
  isPlaying: boolean;
  /**
   * User's *intent* to play, owned by the provider and toggled only by explicit
   * play/pause actions — not by iOS's transient pauses during the PiP-stop
   * transition. Used to re-assert playback when returning to the player.
   */
  playIntentRef: MutableRefObject<boolean>;
  /** Called when a user-initiated PiP stop should bring us back to the player. */
  onReturnToPlayer: () => void;
};

/**
 * Owns Picture-in-Picture for hosted video. It renders an always-mounted,
 * offscreen `VideoView` so PiP survives navigation (a screen's own view is torn
 * down on navigation, and stopping PiP on a different view than the one that
 * owns it is a no-op). The behavioural rule lives in `resolvePipStopAction`;
 * this component is the thin adapter that wires it to expo-video + navigation.
 *
 * Two live views of one player are fine on real devices; only the iOS simulator
 * mis-renders this (a crossed-out "not playable"), which we accept since PiP is
 * device-only anyway.
 */
export function VideoPipHost({
  player,
  active,
  isPlaying,
  playIntentRef,
  onReturnToPlayer,
}: VideoPipHostProps) {
  const segments = useSegments();
  const onPlayerRoute = segments[0] === "player";

  const hostRef = useRef<VideoView>(null);
  const pipActiveRef = useRef(false);
  // Set right before we stop PiP ourselves, so onPictureInPictureStop knows the
  // stop was not a user restore/close tap.
  const programmaticStopRef = useRef(false);

  // Returning to the player: cancel PiP, then re-assert play across iOS's
  // transition pause if the user's intent is to play. Keyed on the route only,
  // so it does not re-run on every play/pause tick.
  useEffect(() => {
    if (!active || !onPlayerRoute || !player) {
      return;
    }

    // Only arm the programmatic flag when PiP is actually live, otherwise
    // stopPictureInPicture is a no-op (no STOP follows) and the flag would
    // wrongly stick to the user's next tap.
    if (pipActiveRef.current) {
      programmaticStopRef.current = true;
    }
    void hostRef.current?.stopPictureInPicture().catch(() => {});
    if (!playIntentRef.current) {
      return;
    }

    const replay = () => {
      try {
        player.play();
      } catch {
        // player may be mid-teardown; ignore
      }
    };
    replay();
    const t1 = setTimeout(replay, 60);
    const t2 = setTimeout(replay, 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, onPlayerRoute, player, playIntentRef]);

  // Away from the player: float the video only if we left WHILE PLAYING.
  // Leaving paused starts nothing; pausing keeps the PiP window (standard
  // behaviour), so we never auto-dismiss on pause.
  useEffect(() => {
    if (!active || onPlayerRoute || !isPlaying) {
      return;
    }

    const timer = setTimeout(() => {
      void hostRef.current?.startPictureInPicture().catch(() => {});
    }, 120);
    return () => clearTimeout(timer);
  }, [active, onPlayerRoute, isPlaying]);

  if (!active || !player) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.hostOffscreen}>
      <VideoView
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={false}
        onPictureInPictureStart={() => {
          pipActiveRef.current = true;
        }}
        onPictureInPictureStop={() => {
          pipActiveRef.current = false;
          const action = resolvePipStopAction({
            stopWasProgrammatic: programmaticStopRef.current,
          });
          programmaticStopRef.current = false;
          if (action === "go-to-player") {
            onReturnToPlayer();
          }
        }}
        player={player}
        ref={hostRef}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hostOffscreen: {
    position: "absolute",
    left: -1000,
    top: 0,
    width: 200,
    height: 112,
  },
});
