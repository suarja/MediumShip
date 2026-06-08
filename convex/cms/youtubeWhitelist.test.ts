/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";

import { api, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { parseYouTubeChannelInput } from "../discovery/youtubeChannelResolve";

const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };
const GUEST = { subject: "guest_1", tokenIdentifier: "token_guest" };
const API_KEY = "test-api-key";

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN.tokenIdentifier,
      clerkId: ADMIN.subject,
      email: "admin@test.com",
      cmsRole: "admin",
    });
  });
}

describe("parseYouTubeChannelInput", () => {
  it("accepts channel ids, urls, and handles", () => {
    expect(
      parseYouTubeChannelInput("UCaNlbnghtwlsGF-KzAFThqA"),
    ).toEqual({
      kind: "channelId",
      channelId: "UCaNlbnghtwlsGF-KzAFThqA",
    });
    expect(
      parseYouTubeChannelInput(
        "https://www.youtube.com/channel/UCaNlbnghtwlsGF-KzAFThqA",
      ),
    ).toEqual({
      kind: "channelId",
      channelId: "UCaNlbnghtwlsGF-KzAFThqA",
    });
    expect(parseYouTubeChannelInput("@ScienceEtonnante")).toEqual({
      kind: "handle",
      handle: "ScienceEtonnante",
    });
    expect(
      parseYouTubeChannelInput("https://www.youtube.com/@ScienceEtonnante"),
    ).toEqual({
      kind: "handle",
      handle: "ScienceEtonnante",
    });
  });
});

describe("cms/youtubeWhitelist — listWhitelistChannelsForCms", () => {
  it("returns all channels including disabled rows", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.mutation(internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist, {});

    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("youtubeWhitelistChannels")
        .withIndex("by_locale", (q) => q.eq("locale", "fr"))
        .first();
      if (!row) {
        throw new Error("Expected seeded channel");
      }
      await ctx.db.patch(row._id, { enabled: false });
    });

    const asAdmin = t.withIdentity(ADMIN);
    const rows = await asAdmin.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
      locale: "fr",
    });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.enabled === false)).toBe(true);
  });

  it("rejects non-admin callers", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: GUEST.tokenIdentifier,
        clerkId: GUEST.subject,
        email: "guest@test.com",
      });
    });

    const asGuest = t.withIdentity(GUEST);
    await expect(
      asGuest.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
        locale: "fr",
      }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("cms/youtubeWhitelist — toggle and remove", () => {
  it("toggles enabled state and removes a channel", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.mutation(internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist, {});

    const asAdmin = t.withIdentity(ADMIN);
    const before = await asAdmin.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
      locale: "fr",
    });
    const target = before[0]!;

    await asAdmin.mutation(api.cms.youtubeWhitelist.toggleWhitelistChannel, {
      channelId: target.channelId,
      locale: "fr",
      enabled: false,
    });

    const disabled = await asAdmin.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
      locale: "fr",
    });
    expect(
      disabled.find((row) => row.channelId === target.channelId)?.enabled,
    ).toBe(false);

    await asAdmin.mutation(api.cms.youtubeWhitelist.removeWhitelistChannel, {
      channelId: target.channelId,
      locale: "fr",
    });

    const after = await asAdmin.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
      locale: "fr",
    });
    expect(after.find((row) => row.channelId === target.channelId)).toBeUndefined();
  });

  it("rejects non-admin mutations", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.mutation(internal.discovery.youtubeWhitelistChannels.seedYoutubeWhitelist, {});
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: GUEST.tokenIdentifier,
        clerkId: GUEST.subject,
        email: "guest@test.com",
      });
    });

    const asGuest = t.withIdentity(GUEST);
    await expect(
      asGuest.mutation(api.cms.youtubeWhitelist.toggleWhitelistChannel, {
        channelId: "UCaNlbnghtwlsGF-KzAFThqA",
        locale: "fr",
        enabled: false,
      }),
    ).rejects.toThrow("Forbidden");
    await expect(
      asGuest.mutation(api.cms.youtubeWhitelist.removeWhitelistChannel, {
        channelId: "UCaNlbnghtwlsGF-KzAFThqA",
        locale: "fr",
      }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("cms/youtubeWhitelist — addWhitelistChannel", () => {
  it("resolves a handle via channels.list and upserts the row", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "UCnewChannel1234567890ab",
            snippet: { title: "New Channel" },
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("YOUTUBE_DATA_API_KEY", API_KEY);

    const asAdmin = t.withIdentity(ADMIN);
    const result = await asAdmin.action(api.cms.youtubeWhitelist.addWhitelistChannel, {
      url: "https://www.youtube.com/@NewChannel",
      locale: "en",
      defaultCategory: "science",
    });

    expect(result).toEqual({
      channelId: "UCnewChannel1234567890ab",
      label: "New Channel",
      locale: "en",
      defaultCategory: "science",
      enabled: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("forHandle=NewChannel");

    const rows = await asAdmin.query(api.cms.youtubeWhitelist.listWhitelistChannelsForCms, {
      locale: "en",
    });
    expect(rows).toContainEqual(
      expect.objectContaining({
        channelId: "UCnewChannel1234567890ab",
        label: "New Channel",
        defaultCategory: "science",
        enabled: true,
      }),
    );

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects non-admin callers", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: GUEST.tokenIdentifier,
        clerkId: GUEST.subject,
        email: "guest@test.com",
      });
    });

    const asGuest = t.withIdentity(GUEST);
    vi.stubEnv("YOUTUBE_DATA_API_KEY", API_KEY);
    await expect(
      asGuest.action(api.cms.youtubeWhitelist.addWhitelistChannel, {
        channelId: "UCaNlbnghtwlsGF-KzAFThqA",
        locale: "fr",
        defaultCategory: "science",
      }),
    ).rejects.toThrow("Forbidden");
    vi.unstubAllEnvs();
  });
});
