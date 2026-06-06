/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const TENANT = "demo-media";

async function seedEvent(
  t: ReturnType<typeof convexTest>,
  overrides: {
    slug: string;
    title: string;
    startsAt: string;
    mode: "online" | "offline" | "hybrid";
    access?: "free" | "member" | "premium";
    status?: "scheduled" | "archived";
  },
) {
  return t.run(async (ctx) =>
    ctx.db.insert("events", {
      tenantSlug: TENANT,
      status: overrides.status ?? "scheduled",
      slug: overrides.slug,
      title: overrides.title,
      summary: `Summary for ${overrides.title}`,
      startsAt: overrides.startsAt,
      locationLabel: "Test Location",
      mode: overrides.mode,
      access: overrides.access ?? "free",
    }),
  );
}

describe("listPublishedEvents", () => {
  it("returns only scheduled events for the tenant", async () => {
    const t = convexTest(schema, modules);

    await seedEvent(t, { slug: "e1", title: "Scheduled Event", startsAt: "2030-01-01T10:00:00", mode: "online" });
    await seedEvent(t, { slug: "e2", title: "Archived Event", startsAt: "2030-01-02T10:00:00", mode: "online", status: "archived" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "online",
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Scheduled Event");
  });

  it("upcoming filter: returns events with startsAt in the future (relative to test time)", async () => {
    const t = convexTest(schema, modules);
    const future = "2099-12-31T10:00:00";
    const past = "2000-01-01T10:00:00";

    await seedEvent(t, { slug: "future", title: "Future Event", startsAt: future, mode: "offline" });
    await seedEvent(t, { slug: "past", title: "Past Event", startsAt: past, mode: "offline" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "upcoming",
    });

    expect(result.map((e) => e.title)).toContain("Future Event");
    expect(result.map((e) => e.title)).not.toContain("Past Event");
  });

  it("online filter: returns online + hybrid events", async () => {
    const t = convexTest(schema, modules);

    await seedEvent(t, { slug: "online-e", title: "Online Event", startsAt: "2030-01-01T10:00:00", mode: "online" });
    await seedEvent(t, { slug: "hybrid-e", title: "Hybrid Event", startsAt: "2030-01-02T10:00:00", mode: "hybrid" });
    await seedEvent(t, { slug: "offline-e", title: "Offline Event", startsAt: "2030-01-03T10:00:00", mode: "offline" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "online",
    });

    expect(result.map((e) => e.title)).toEqual(["Online Event", "Hybrid Event"]);
  });

  it("local filter: returns offline + hybrid events", async () => {
    const t = convexTest(schema, modules);

    await seedEvent(t, { slug: "online-e", title: "Online Event", startsAt: "2030-01-01T10:00:00", mode: "online" });
    await seedEvent(t, { slug: "hybrid-e", title: "Hybrid Event", startsAt: "2030-01-02T10:00:00", mode: "hybrid" });
    await seedEvent(t, { slug: "offline-e", title: "Offline Event", startsAt: "2030-01-03T10:00:00", mode: "offline" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "local",
    });

    expect(result.map((e) => e.title)).toEqual(["Hybrid Event", "Offline Event"]);
  });

  it("returns events sorted by startsAt ascending", async () => {
    const t = convexTest(schema, modules);

    await seedEvent(t, { slug: "e3", title: "Third", startsAt: "2030-03-01T10:00:00", mode: "online" });
    await seedEvent(t, { slug: "e1", title: "First", startsAt: "2030-01-01T10:00:00", mode: "online" });
    await seedEvent(t, { slug: "e2", title: "Second", startsAt: "2030-02-01T10:00:00", mode: "online" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "online",
    });

    expect(result.map((e) => e.title)).toEqual(["First", "Second", "Third"]);
  });

  it("guest identity: no auth required", async () => {
    const t = convexTest(schema, modules);
    await seedEvent(t, { slug: "pub", title: "Public Event", startsAt: "2030-01-01T10:00:00", mode: "online" });

    const result = await t.query(api.events.queries.listPublishedEvents, {
      tenantSlug: TENANT,
      filter: "online",
    });

    expect(result).toHaveLength(1);
  });
});

describe("getPublishedEventById", () => {
  it("returns the event for a valid scheduled id", async () => {
    const t = convexTest(schema, modules);
    const id = await seedEvent(t, {
      slug: "detail-event",
      title: "Detail Event",
      startsAt: "2030-06-01T10:00:00",
      mode: "hybrid",
      access: "member",
    });

    const result = await t.query(api.events.queries.getPublishedEventById, { id });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Detail Event");
    expect(result!.mode).toBe("hybrid");
    expect(result!.access).toBe("member");
  });

  it("returns null for an archived event", async () => {
    const t = convexTest(schema, modules);
    const id = await seedEvent(t, {
      slug: "archived-event",
      title: "Archived Event",
      startsAt: "2030-06-01T10:00:00",
      mode: "online",
      status: "archived",
    });

    const result = await t.query(api.events.queries.getPublishedEventById, { id });
    expect(result).toBeNull();
  });
});
