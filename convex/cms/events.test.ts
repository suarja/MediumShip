import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };
const GUEST = { subject: "guest_1", tokenIdentifier: "token_guest" };

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

describe("cms events", () => {
  it("rejects non-admin on listCmsEvents", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.withIdentity(GUEST).query(api.cms.events.listCmsEvents, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("listCmsEvents returns scheduled and archived events", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const scheduledId = await asAdmin.mutation(api.cms.events.createEvent, {
      title: "Upcoming",
      slug: "upcoming",
      summary: "soon",
      startsAt: "2026-12-01T19:00:00.000Z",
      locationLabel: "Paris",
      mode: "offline",
      access: "free",
    });
    const archivedId = await asAdmin.mutation(api.cms.events.createEvent, {
      title: "Past",
      slug: "past",
      summary: "gone",
      startsAt: "2026-01-01T19:00:00.000Z",
      locationLabel: "Lyon",
      mode: "online",
      access: "member",
    });
    await asAdmin.mutation(api.cms.events.setEventStatus, {
      id: archivedId,
      status: "archived",
    });

    const list = await asAdmin.query(api.cms.events.listCmsEvents, {});
    const ids = list.map((row) => row._id);

    expect(ids).toContain(scheduledId);
    expect(ids).toContain(archivedId);
  });

  it("createEvent inserts scheduled status with validated fields", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.events.createEvent, {
      title: "Atelier",
      slug: "atelier",
      summary: "Workshop",
      startsAt: "2026-10-02T20:00:00.000Z",
      locationLabel: "Visio",
      mode: "online",
      access: "member",
      ctaLabel: "Join",
      communityUrl: "https://discord.gg/example",
    });

    const event = await asAdmin.query(api.cms.events.getCmsEvent, { id });
    expect(event?.status).toBe("scheduled");
    expect(event?.mode).toBe("online");
    expect(event?.access).toBe("member");
    expect(event?.startsAt).toBe("2026-10-02T20:00:00.000Z");
  });

  it("createEvent rejects invalid startsAt", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    await expect(
      asAdmin.mutation(api.cms.events.createEvent, {
        title: "Broken date",
        slug: "broken-date",
        summary: "nope",
        startsAt: "not-a-date",
        locationLabel: "Nowhere",
        mode: "hybrid",
        access: "premium",
      }),
    ).rejects.toThrow(/valid ISO date/);
  });

  it("updateEvent patches metadata", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.events.createEvent, {
      title: "Before",
      slug: "before-event",
      summary: "old",
      startsAt: "2026-11-01T18:00:00.000Z",
      locationLabel: "Paris",
      mode: "offline",
      access: "free",
    });

    await asAdmin.mutation(api.cms.events.updateEvent, {
      id,
      slug: "after-event",
      title: "After",
      summary: "new",
      startsAt: "2026-11-02T18:00:00.000Z",
      locationLabel: "Lyon",
      mode: "hybrid",
      access: "premium",
      coverImageUrl: null,
      ctaLabel: null,
      ctaUrl: null,
      communityUrl: null,
      descriptionLong: "Long description",
    });

    const event = await asAdmin.query(api.cms.events.getCmsEvent, { id });
    expect(event?.title).toBe("After");
    expect(event?.slug).toBe("after-event");
    expect(event?.mode).toBe("hybrid");
    expect(event?.access).toBe("premium");
    expect(event?.descriptionLong).toBe("Long description");
  });

  it("setEventStatus flips scheduled and archived", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.events.createEvent, {
      title: "Toggle",
      slug: "toggle-event",
      summary: "toggle",
      startsAt: "2026-11-15T19:00:00.000Z",
      locationLabel: "Remote",
      mode: "online",
      access: "free",
    });

    await asAdmin.mutation(api.cms.events.setEventStatus, {
      id,
      status: "archived",
    });
    let event = await asAdmin.query(api.cms.events.getCmsEvent, { id });
    expect(event?.status).toBe("archived");

    await asAdmin.mutation(api.cms.events.setEventStatus, {
      id,
      status: "scheduled",
    });
    event = await asAdmin.query(api.cms.events.getCmsEvent, { id });
    expect(event?.status).toBe("scheduled");
  });
});
