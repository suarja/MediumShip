import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

const SNIPPET_MAX = 280;

/** Minimal security telemetry for insights prompt sanitization. */
export const recordInsightsSecurityEvent = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    kind: v.union(
      v.literal("injection_high"),
      v.literal("injection_low"),
      v.literal("control_chars"),
    ),
    matched: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const snippet = args.content
      ? args.content.slice(0, SNIPPET_MAX)
      : undefined;

    console.warn("[insights:security]", {
      tokenIdentifier: args.tokenIdentifier,
      kind: args.kind,
      matched: args.matched,
      snippet,
    });

    return null;
  },
});
