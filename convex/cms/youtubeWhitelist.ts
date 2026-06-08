import { v } from "convex/values";

import { action, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { resolveYouTubeChannel } from "../discovery/youtubeChannelResolve";
import { requireCmsAdmin } from "./authz";

const localeValidator = v.union(v.literal("fr"), v.literal("en"));

function getEnv(name: string): string | undefined {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];
}

export const listWhitelistChannelsForCms = query({
  args: {
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const rows = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_locale", (q) => q.eq("locale", args.locale))
      .collect();

    return rows
      .map((row) => ({
        _id: row._id,
        channelId: row.channelId,
        label: row.label,
        defaultCategory: row.defaultCategory,
        locale: row.locale,
        enabled: row.enabled,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, args.locale));
  },
});

export const removeWhitelistChannel = mutation({
  args: {
    channelId: v.string(),
    locale: localeValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_channelId_and_locale", (q) =>
        q.eq("channelId", args.channelId).eq("locale", args.locale),
      )
      .unique();

    if (!existing) {
      throw new Error("Whitelist channel not found");
    }

    await ctx.db.delete(existing._id);
    return { removed: true as const };
  },
});

export const toggleWhitelistChannel = mutation({
  args: {
    channelId: v.string(),
    locale: localeValidator,
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_channelId_and_locale", (q) =>
        q.eq("channelId", args.channelId).eq("locale", args.locale),
      )
      .unique();

    if (!existing) {
      throw new Error("Whitelist channel not found");
    }

    await ctx.db.patch(existing._id, { enabled: args.enabled });
    return { channelId: args.channelId, enabled: args.enabled };
  },
});

export const addWhitelistChannel = action({
  args: {
    url: v.optional(v.string()),
    channelId: v.optional(v.string()),
    locale: localeValidator,
    defaultCategory: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.cms.authz.assertCmsAdmin, {});

    const input = args.url?.trim() || args.channelId?.trim();
    if (!input) {
      throw new Error("A YouTube URL, handle, or channelId is required");
    }

    const defaultCategory = args.defaultCategory.trim();
    if (!defaultCategory) {
      throw new Error("defaultCategory is required");
    }

    const apiKey = getEnv("YOUTUBE_DATA_API_KEY");
    if (!apiKey) {
      throw new Error("YOUTUBE_DATA_API_KEY is not configured");
    }

    const resolved = await resolveYouTubeChannel(input, apiKey);

    await ctx.runMutation(internal.discovery.youtubeWhitelistChannels.upsertWhitelistChannel, {
      channelId: resolved.channelId,
      label: resolved.label,
      defaultCategory,
      locale: args.locale,
      enabled: true,
    });

    return {
      channelId: resolved.channelId,
      label: resolved.label,
      locale: args.locale,
      defaultCategory,
      enabled: true as const,
    };
  },
});
