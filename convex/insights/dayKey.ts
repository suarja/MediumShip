/** UTC calendar day for idempotent daily generation. */
export function formatDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}
