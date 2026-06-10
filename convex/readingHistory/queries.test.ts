import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import {
  END_THRESHOLD_SECONDS,
  MIN_RESUMABLE_SECONDS,
} from "../playbackProgress/resume";

const MEMBER = { subject: "member_hist", tokenIdentifier: "token_member_hist" };
const GUEST = { subject: "guest_hist", tokenIdentifier: "token_guest_hist" };

async function seedMember(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("entitlements", {
      tokenIdentifier: MEMBER.tokenIdentifier,
      clerkId: MEMBER.subject,
      isPro: true,
      source: "manual",
      updatedAt: Date.now(),
    });
  });
}

async function insertContent(
  t: ReturnType<typeof convexTest>,
  args: {
    kind?: "article" | "episode" | "video";
    status?: "draft" | "published" | "archived";
    title?: string;
    durationSeconds?: number;
  } = {},
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: "demo-media",
      kind: args.kind ?? "episode",
      status: args.status ?? "published",
      slug: `content-${Math.random().toString(36).slice(2, 8)}`,
      title: args.title ?? "Sample content",
      summary: "Summary",
      category: "Politique",
      tags: [],
      isPremium: false,
      durationSeconds: args.durationSeconds,
    }),
  );
}

async function insertOpen(
  t: ReturnType<typeof convexTest>,
  contentId: Id<"contents">,
  createdAt: number,
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("contentInteractions", {
      tokenIdentifier: MEMBER.tokenIdentifier,
      tenantSlug: "demo-media",
      contentId,
      type: "open",
      createdAt,
    });
  });
}

describe("getReadingHistory", () => {
  it("rejects a guest", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.readingHistory.queries.getReadingHistory, {}),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("rejects a signed-in non-member", async () => {
    const t = convexTest(schema, modules);
    const asGuest = t.withIdentity(GUEST);
    await expect(
      asGuest.query(api.readingHistory.queries.getReadingHistory, {}),
    ).rejects.toThrow(/Member access required/);
  });

  it("deduplicates by contentId keeping the most recent open", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, { title: "Deduped episode" });
    await insertOpen(t, contentId, 1_000);
    await insertOpen(t, contentId, 2_000);

    const asMember = t.withIdentity(MEMBER);
    const history = await asMember.query(
      api.readingHistory.queries.getReadingHistory,
      {},
    );

    expect(history).toHaveLength(1);
    expect(history[0]?.contentId).toBe(contentId);
    expect(history[0]?.openedAt).toBe(2_000);
  });

  it("excludes opens at or before clearedAt while keeping later opens", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const beforeClear = await insertContent(t, { title: "Before clear" });
    const afterClear = await insertContent(t, { title: "After clear" });

    await insertOpen(t, beforeClear, 1_000);
    await insertOpen(t, afterClear, 3_000);

    const asMember = t.withIdentity(MEMBER);
    await asMember.mutation(api.readingHistory.mutations.clearReadingHistory, {});

    await t.run(async (ctx) => {
      await ctx.db.patch(
        (
          await ctx.db
            .query("readingHistoryState")
            .withIndex("by_tokenIdentifier", (q) =>
              q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
            )
            .unique()
        )!._id,
        { clearedAt: 2_000 },
      );
    });

    const history = await asMember.query(
      api.readingHistory.queries.getReadingHistory,
      {},
    );

    expect(history).toHaveLength(1);
    expect(history[0]?.contentId).toBe(afterClear);
    expect(history[0]?.openedAt).toBe(3_000);

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("contentInteractions")
        .withIndex("by_tokenIdentifier_and_contentId", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );
    expect(rows).toHaveLength(2);
  });

  it("excludes unpublished content", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const draftId = await insertContent(t, {
      status: "draft",
      title: "Draft only",
    });
    await insertOpen(t, draftId, Date.now());

    const asMember = t.withIdentity(MEMBER);
    const history = await asMember.query(
      api.readingHistory.queries.getReadingHistory,
      {},
    );

    expect(history).toHaveLength(0);
  });

  it("includes progressRatio when playback progress exists", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, {
      kind: "episode",
      durationSeconds: 100,
      title: "With progress",
    });
    await insertOpen(t, contentId, Date.now());
    await t.run(async (ctx) => {
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId,
        seconds: 50,
        updatedAt: Date.now(),
      });
    });

    const asMember = t.withIdentity(MEMBER);
    const history = await asMember.query(
      api.readingHistory.queries.getReadingHistory,
      {},
    );

    expect(history[0]?.progressRatio).toBeCloseTo(0.5);
  });

  it("omits progressRatio when no playback progress exists", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, {
      kind: "article",
      title: "Article only",
    });
    await insertOpen(t, contentId, Date.now());

    const asMember = t.withIdentity(MEMBER);
    const history = await asMember.query(
      api.readingHistory.queries.getReadingHistory,
      {},
    );

    expect(history[0]?.progressRatio).toBeUndefined();
  });
});

describe("getResume", () => {
  it("rejects a signed-in non-member", async () => {
    const t = convexTest(schema, modules);
    const asGuest = t.withIdentity(GUEST);
    await expect(
      asGuest.query(api.readingHistory.queries.getResume, {}),
    ).rejects.toThrow(/Member access required/);
  });

  it("returns null when nothing is resumable", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const asMember = t.withIdentity(MEMBER);
    await expect(asMember.query(api.readingHistory.queries.getResume, {})).resolves.toBeNull();
  });

  it("excludes finished media", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, {
      kind: "episode",
      durationSeconds: 100,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId,
        seconds: 100 - END_THRESHOLD_SECONDS + 1,
        updatedAt: 1_000,
      });
    });

    const asMember = t.withIdentity(MEMBER);
    await expect(asMember.query(api.readingHistory.queries.getResume, {})).resolves.toBeNull();
  });

  it("excludes unpublished content", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, {
      kind: "episode",
      status: "draft",
      durationSeconds: 100,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId,
        seconds: 50,
        updatedAt: Date.now(),
      });
    });

    const asMember = t.withIdentity(MEMBER);
    await expect(asMember.query(api.readingHistory.queries.getResume, {})).resolves.toBeNull();
  });

  it("excludes articles", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const contentId = await insertContent(t, {
      kind: "article",
      durationSeconds: 100,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId,
        seconds: 50,
        updatedAt: Date.now(),
      });
    });

    const asMember = t.withIdentity(MEMBER);
    await expect(asMember.query(api.readingHistory.queries.getResume, {})).resolves.toBeNull();
  });

  it("returns the most recent resumable media item", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const older = await insertContent(t, {
      kind: "episode",
      title: "Older episode",
      durationSeconds: 200,
    });
    const newer = await insertContent(t, {
      kind: "video",
      title: "Newer video",
      durationSeconds: 200,
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId: older,
        seconds: MIN_RESUMABLE_SECONDS + 10,
        updatedAt: 1_000,
      });
      await ctx.db.insert("playbackProgress", {
        tokenIdentifier: MEMBER.tokenIdentifier,
        contentId: newer,
        seconds: MIN_RESUMABLE_SECONDS + 20,
        updatedAt: 2_000,
      });
    });

    const asMember = t.withIdentity(MEMBER);
    const resume = await asMember.query(api.readingHistory.queries.getResume, {});

    expect(resume?.contentId).toBe(newer);
    expect(resume?.kind).toBe("video");
    expect(resume?.progressRatio).toBeCloseTo((MIN_RESUMABLE_SECONDS + 20) / 200);
  });
});
