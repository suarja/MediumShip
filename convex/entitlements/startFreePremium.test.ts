import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const FREE_USER = { subject: "user_free", tokenIdentifier: "token_free" };
const MEMBER_USER = { subject: "user_member", tokenIdentifier: "token_member" };

describe("startFreePremium", () => {
  it("rejects a guest", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.entitlements.mutations.startFreePremium, {}),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("grants isPro for a signed-in non-premium member", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity(MEMBER_USER);

    const result = await asMember.mutation(
      api.entitlements.mutations.startFreePremium,
      {},
    );
    expect(result).toEqual({ isPro: true });

    const row = await t.run(async (ctx) =>
      ctx.db
        .query("entitlements")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER_USER.tokenIdentifier),
        )
        .unique(),
    );
    expect(row?.isPro).toBe(true);
    expect(row?.source).toBe("trial");
  });

  it("is idempotent on replay without creating a duplicate row", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity(MEMBER_USER);

    await asMember.mutation(api.entitlements.mutations.startFreePremium, {});
    await asMember.mutation(api.entitlements.mutations.startFreePremium, {});

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("entitlements")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", MEMBER_USER.tokenIdentifier),
        )
        .collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.source).toBe("trial");
  });

  it("does not downgrade an existing revenuecat entitlement", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("entitlements", {
        tokenIdentifier: FREE_USER.tokenIdentifier,
        clerkId: FREE_USER.subject,
        isPro: true,
        source: "revenuecat",
        updatedAt: Date.now(),
      });
    });

    const asUser = t.withIdentity(FREE_USER);
    const result = await asUser.mutation(
      api.entitlements.mutations.startFreePremium,
      {},
    );
    expect(result).toEqual({ isPro: true });

    const row = await t.run(async (ctx) =>
      ctx.db
        .query("entitlements")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", FREE_USER.tokenIdentifier),
        )
        .unique(),
    );
    expect(row?.source).toBe("revenuecat");
    expect(row?.isPro).toBe(true);
  });
});
