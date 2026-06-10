/** UTC calendar day — must match `convex/insights/dayKey.ts`. */
export function formatDayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}
