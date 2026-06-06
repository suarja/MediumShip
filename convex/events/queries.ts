import { v } from "convex/values";

import { query } from "../_generated/server";
import { filterEvents, sortByStartsAt, toAppEvent } from "./model";

export const listPublishedEvents = query({
  args: {
    tenantSlug: v.string(),
    filter: v.union(
      v.literal("upcoming"),
      v.literal("online"),
      v.literal("local"),
    ),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "scheduled"),
      )
      .collect();

    const nowIso = new Date().toISOString();
    const filtered = filterEvents(events, args.filter, nowIso);
    const sorted = sortByStartsAt(filtered);

    return sorted.map(toAppEvent);
  },
});

export const getPublishedEventById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event || event.status !== "scheduled") return null;
    return toAppEvent(event);
  },
});
