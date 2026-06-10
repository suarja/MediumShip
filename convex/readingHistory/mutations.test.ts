import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const MEMBER = { subject: "member_clear", tokenIdentifier: "token_member_clear" };

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

describe("clearReadingHistory", () => {
  it("rejects a guest", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.readingHistory.mutations.clearReadingHistory, {}),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("upserts clearedAt for a member", async () => {
    const t = convexTest(schema, modules);
    await seedMember(t);
    const asMember = t.withIdentity(MEMBER);

    const first = await asMember.mutation(
      api.readingHistory.mutations.clearReadingHistory,
      {},
    );
    expect(first.clearedAt).toBeGreaterThan(0);

    const second = await asMember.mutation(
      api.readingHistory.mutations.clearReadingHistory,
      {},
    );
    expect(second.clearedAt).toBeGreaterThanOrEqual(first.clearedAt);

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("readingHistoryState")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER.tokenIdentifier),
        )
        .collect(),
    );
    expect(rows).toHaveLength(1);
  });
});
