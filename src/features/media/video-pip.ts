// The single place that states what a Picture-in-Picture stop should do.
//
// iOS surfaces only one indistinguishable "stop" for both the PiP *restore*
// control and the *close* (X) button — there is no JS-observable difference
// (playback reads paused in both cases) and AVKit does not call the restore
// delegate while our offscreen host stays mounted. So we make the product
// choice explicit and deterministic instead of guessing: any user-initiated
// PiP stop returns to the full player. Our own programmatic stops (when the
// user navigates back to the player) are ignored to avoid a navigation loop.

export type PipStopAction = "go-to-player" | "ignore";

export function resolvePipStopAction(input: {
  /** True when *we* called stopPictureInPicture (returning to the player). */
  stopWasProgrammatic: boolean;
}): PipStopAction {
  if (input.stopWasProgrammatic) {
    return "ignore";
  }
  return "go-to-player";
}
