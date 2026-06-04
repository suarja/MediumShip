export function getScrubTimeFromPress(
  pressX: number,
  trackWidth: number,
  durationSeconds: number,
) {
  if (trackWidth <= 0 || durationSeconds <= 0) {
    return 0;
  }

  const ratio = Math.max(0, Math.min(pressX / trackWidth, 1));
  return ratio * durationSeconds;
}
