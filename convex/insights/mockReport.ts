import { v } from "convex/values";

/** Shared test hook for cron + generate actions. */
export const mockReportValidator = v.object({
  overview: v.string(),
  reflection: v.optional(v.string()),
  trends: v.optional(v.string()),
  picks: v.array(
    v.object({
      slot: v.number(),
      rationale: v.string(),
    }),
  ),
});
