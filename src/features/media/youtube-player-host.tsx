import { StyleSheet, View } from "react-native";

import type { YoutubePlayerHandle } from "../../components/media/youtube-player";
import { YoutubePlayerSurface } from "../../components/media/youtube-player";
import type { YoutubePlayerSlotLayout } from "./youtube-player-layout-context";
import type { YoutubePlayerSnapshot } from "./youtube-player-state";

type YoutubePlayerHostProps = {
  active: boolean;
  videoId: string | null;
  play: boolean;
  onPlayerRoute: boolean;
  slotLayout: YoutubePlayerSlotLayout | null;
  preferredResumeSeconds: number | null;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  onTimeUpdate: (update: {
    currentSeconds: number;
    durationSeconds: number;
  }) => void;
  onSnapshotChange: (snapshot: YoutubePlayerSnapshot) => void;
  onReady?: () => void;
  onError?: (error: string) => void;
};

/**
 * Owns the persistent YouTube WebView. One instance survives navigation: on
 * the player route it overlays the slot placeholder; away from the player it
 * keeps playing offscreen while the docked mini-player supplies controls.
 *
 * OS Picture-in-Picture is unavailable behind a WebView — this is the in-app
 * equivalent for YouTube.
 */
export function YoutubePlayerHost({
  active,
  videoId,
  play,
  onPlayerRoute,
  slotLayout,
  preferredResumeSeconds,
  playerRef,
  onTimeUpdate,
  onSnapshotChange,
  onReady,
  onError,
}: YoutubePlayerHostProps) {
  if (!active || !videoId) {
    return null;
  }

  const visibleOnPlayer = onPlayerRoute && slotLayout !== null;
  const height = visibleOnPlayer ? slotLayout.height : 112;
  const width = visibleOnPlayer ? slotLayout.width : 200;

  return (
    <View
      pointerEvents={visibleOnPlayer ? "auto" : "none"}
      style={
        visibleOnPlayer
          ? {
              position: "absolute",
              left: slotLayout.x,
              top: slotLayout.y,
              width: slotLayout.width,
              height: slotLayout.height,
              zIndex: 20,
            }
          : styles.hostOffscreen
      }
    >
      <YoutubePlayerSurface
        ref={playerRef}
        height={height}
        width={width}
        play={play}
        preferredResumeSeconds={preferredResumeSeconds}
        videoId={videoId}
        onError={onError}
        onReady={onReady}
        onSnapshotChange={onSnapshotChange}
        onTimeUpdate={onTimeUpdate}
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
