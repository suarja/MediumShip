/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import {
  YOUTUBE_WHITELIST_EN,
  YOUTUBE_WHITELIST_FR,
} from "./providers/youtubeWhitelist";

describe("youtubeWhitelistChannels — seedYoutubeWhitelist", () => {
  it("imports FR and EN constants idempotently", async () => {
    const t = convexTest(schema, modules);

    const first = await t.mutation(
      internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist,
      {},
    );
    expect(first).toEqual({
      inserted: YOUTUBE_WHITELIST_FR.length + YOUTUBE_WHITELIST_EN.length,
      skipped: 0,
    });

    const second = await t.mutation(
      internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist,
      {},
    );
    expect(second).toEqual({
      inserted: 0,
      skipped: YOUTUBE_WHITELIST_FR.length + YOUTUBE_WHITELIST_EN.length,
    });

    const frRows = await t.run(async (ctx) =>
      ctx.db
        .query("youtubeWhitelistChannels")
        .withIndex("by_locale", (q) => q.eq("locale", "fr"))
        .collect(),
    );
    expect(frRows).toHaveLength(YOUTUBE_WHITELIST_FR.length);
    expect(frRows.every((row) => row.enabled)).toBe(true);
    expect(frRows.map((row) => row.channelId).sort()).toEqual(
      YOUTUBE_WHITELIST_FR.map((entry) => entry.channelId).sort(),
    );
  });
});

describe("youtubeWhitelistChannels — listWhitelistChannels", () => {
  it("returns only enabled channels for the locale", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist, {});

    await t.run(async (ctx) => {
      const disabled = await ctx.db
        .query("youtubeWhitelistChannels")
        .withIndex("by_locale", (q) => q.eq("locale", "fr"))
        .first();
      if (!disabled) {
        throw new Error("Expected seeded FR channel");
      }
      await ctx.db.patch(disabled._id, { enabled: false });
    });

    const enabled = await t.query(
      internal.discovery.youtubeWhitelistChannels.listWhitelistChannels,
      { locale: "fr" },
    );

    expect(enabled).toHaveLength(YOUTUBE_WHITELIST_FR.length - 1);
    expect(enabled.every((row) => row.channelId.length > 0)).toBe(true);
    expect(enabled[0]).toMatchObject({
      channelId: expect.any(String),
      defaultCategory: expect.any(String),
    });
  });
});
