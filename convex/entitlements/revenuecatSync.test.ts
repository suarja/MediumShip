/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import revenuecatTest from "convex-revenuecat/test";
import { describe, expect, it } from "vitest";

import { components, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const CLERK_ID = "user_rc_sync_001";
const UNKNOWN_CLERK_ID = "user_rc_unknown";

function initTest() {
  const t = convexTest(schema, modules);
  revenuecatTest.register(t);
  return t;
}

function createEventPayload(
  overrides: Partial<{
    type: string;
    id: string;
    app_user_id: string;
    entitlement_ids: string[];
    expiration_at_ms: number;
    period_type: string;
  }> = {},
) {
  return {
    type: overrides.type ?? "INITIAL_PURCHASE",
    id: overrides.id ?? `evt_${Date.now()}_${Math.random()}`,
    app_id: "app_123",
    app_user_id: overrides.app_user_id ?? CLERK_ID,
    original_app_user_id: overrides.app_user_id ?? CLERK_ID,
    aliases: [],
    event_timestamp_ms: Date.now(),
    product_id: "premium_monthly",
    entitlement_ids: overrides.entitlement_ids ?? ["premium"],
    period_type: overrides.period_type ?? "NORMAL",
    purchased_at_ms: Date.now(),
    expiration_at_ms:
      overrides.expiration_at_ms ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
    transaction_id: `txn_${Date.now()}`,
    original_transaction_id: `txn_original_${Date.now()}`,
    store: "APP_STORE" as const,
    environment: "SANDBOX" as const,
    is_family_share: false,
  };
}

async function processRcEvent(
  t: ReturnType<typeof initTest>,
  payload: ReturnType<typeof createEventPayload>,
) {
  await t.mutation(components.revenuecat.webhooks.process, {
    event: {
      id: payload.id,
      type: payload.type,
      app_id: payload.app_id,
      app_user_id: payload.app_user_id,
      environment: payload.environment,
      store: payload.store,
    },
    payload,
  });

  await t.mutation(internal.entitlements.revenuecatSync.syncForClerkId, {
    clerkId: payload.app_user_id,
  });
}

async function seedUser(t: ReturnType<typeof initTest>, clerkId = CLERK_ID) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: `token_${clerkId}`,
      clerkId,
      email: `${clerkId}@test.com`,
    });
  });
}

async function readEntitlement(t: ReturnType<typeof initTest>, clerkId = CLERK_ID) {
  return t.run(async (ctx) =>
    ctx.db
      .query("entitlements")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique(),
  );
}

describe("entitlements/revenuecatSync", () => {
  it("purchase / trial → isPro true", async () => {
    const t = initTest();
    await seedUser(t);

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_purchase_1",
        type: "INITIAL_PURCHASE",
        period_type: "TRIAL",
      }),
    );

    const row = await readEntitlement(t);
    expect(row?.isPro).toBe(true);
    expect(row?.source).toBe("revenuecat");
  });

  it("CANCELLATION with active period → isPro stays true", async () => {
    const t = initTest();
    await seedUser(t);
    const futureExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_cancel_initial",
        type: "INITIAL_PURCHASE",
        expiration_at_ms: futureExpiration,
      }),
    );

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_cancel_event",
        type: "CANCELLATION",
        expiration_at_ms: futureExpiration,
      }),
    );

    const row = await readEntitlement(t);
    expect(row?.isPro).toBe(true);
  });

  it("EXPIRATION → isPro false", async () => {
    const t = initTest();
    await seedUser(t);

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_expire_initial",
        type: "INITIAL_PURCHASE",
        expiration_at_ms: Date.now() + 1000,
      }),
    );

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_expire_event",
        type: "EXPIRATION",
        expiration_at_ms: Date.now() - 1000,
      }),
    );

    const row = await readEntitlement(t);
    expect(row?.isPro).toBe(false);
  });

  it("BILLING_ISSUE grace period → isPro stays true", async () => {
    const t = initTest();
    await seedUser(t);
    const futureExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_billing_initial",
        type: "INITIAL_PURCHASE",
        expiration_at_ms: futureExpiration,
      }),
    );

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_billing_issue",
        type: "BILLING_ISSUE",
        expiration_at_ms: futureExpiration,
      }),
    );

    const row = await readEntitlement(t);
    expect(row?.isPro).toBe(true);
  });

  it("REFUND → isPro false", async () => {
    const t = initTest();
    await seedUser(t);

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_refund_initial",
        type: "INITIAL_PURCHASE",
      }),
    );

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_refund_event",
        type: "REFUND",
      }),
    );

    const row = await readEntitlement(t);
    expect(row?.isPro).toBe(false);
  });

  it("replaying sync is idempotent", async () => {
    const t = initTest();
    await seedUser(t);

    const payload = createEventPayload({
      id: "evt_idempotent",
      type: "INITIAL_PURCHASE",
    });
    await processRcEvent(t, payload);

    const first = await readEntitlement(t);
    expect(first?.isPro).toBe(true);

    await t.mutation(internal.entitlements.revenuecatSync.syncForClerkId, {
      clerkId: CLERK_ID,
    });
    await t.mutation(internal.entitlements.revenuecatSync.syncForClerkId, {
      clerkId: CLERK_ID,
    });

    const all = await t.run(async (ctx) =>
      ctx.db
        .query("entitlements")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", CLERK_ID))
        .collect(),
    );
    expect(all).toHaveLength(1);
    expect(all[0]?.isPro).toBe(true);
    expect(all[0]?._id).toEqual(first?._id);
  });

  it("unknown clerkId → no-op", async () => {
    const t = initTest();

    await processRcEvent(
      t,
      createEventPayload({
        id: "evt_unknown_user",
        type: "INITIAL_PURCHASE",
        app_user_id: UNKNOWN_CLERK_ID,
      }),
    );

    const result = await t.mutation(internal.entitlements.revenuecatSync.syncForClerkId, {
      clerkId: UNKNOWN_CLERK_ID,
    });
    expect(result).toBeNull();

    const row = await readEntitlement(t, UNKNOWN_CLERK_ID);
    expect(row).toBeNull();
  });
});
