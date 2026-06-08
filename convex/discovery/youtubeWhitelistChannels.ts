import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import {
  YOUTUBE_WHITELIST,
  type YouTubeWhitelistLocale,
} from "./providers/youtubeWhitelist";

const localeValidator = v.union(v.literal("fr"), v.literal("en"));

export const seedYoutubeWhitelist = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;

    for (const locale of ["fr", "en"] as const satisfies YouTubeWhitelistLocale[]) {
      for (const entry of YOUTUBE_WHITELIST[locale]) {
        const existing = await ctx.db
          .query("youtubeWhitelistChannels")
          .withIndex("by_channelId_and_locale", (q) =>
            q.eq("channelId", entry.channelId).eq("locale", locale),
          )
          .unique();

        if (existing) {
          skipped += 1;
          continue;
        }

        await ctx.db.insert("youtubeWhitelistChannels", {
          channelId: entry.channelId,
          label: entry.label,
          defaultCategory: entry.defaultCategory,
          locale,
          enabled: true,
        });
        inserted += 1;
      }
    }

    return { inserted, skipped };
  },
});

export const upsertWhitelistChannel = internalMutation({
  args: {
    channelId: v.string(),
    label: v.string(),
    defaultCategory: v.string(),
    locale: localeValidator,
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_channelId_and_locale", (q) =>
        q.eq("channelId", args.channelId).eq("locale", args.locale),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        label: args.label,
        defaultCategory: args.defaultCategory,
        enabled: args.enabled,
      });
      return existing._id;
    }

    return await ctx.db.insert("youtubeWhitelistChannels", {
      channelId: args.channelId,
      label: args.label,
      defaultCategory: args.defaultCategory,
      locale: args.locale,
      enabled: args.enabled,
    });
  },
});

export const listWhitelistChannels = internalQuery({
  args: {
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_locale", (q) => q.eq("locale", args.locale))
      .collect();

    return rows
      .filter((row) => row.enabled)
      .map((row) => ({
        channelId: row.channelId,
        label: row.label,
        defaultCategory: row.defaultCategory,
      }));
  },
});
