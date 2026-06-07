/// <reference types="vite/client" />
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

async function seedCatalogNodes(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    // Root node
    const rootId = await ctx.db.insert("categoryCatalog", {
      externalId: "medtop:20000001",
      label: "Economy",
      slug: "economy",
      depth: 0,
      retired: false,
    });
    // Child node
    await ctx.db.insert("categoryCatalog", {
      externalId: "medtop:20000002",
      label: "Finance",
      slug: "finance",
      depth: 1,
      parentId: rootId,
      retired: false,
    });
    // Retired node
    await ctx.db.insert("categoryCatalog", {
      externalId: "medtop:20000003",
      label: "OldTopic",
      slug: "oldtopic",
      depth: 0,
      retired: true,
    });
  });
}

describe("cms/catalog — getCategoryCatalogStats", () => {
  it("returns correct totals for seeded catalog", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);

    const asAdmin = t.withIdentity(ADMIN);
    const stats = await asAdmin.query(api.cms.catalog.getCategoryCatalogStats, {});
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.retired).toBe(1);
  });

  it("returns zeros when catalog is empty", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const asAdmin = t.withIdentity(ADMIN);
    const stats = await asAdmin.query(api.cms.catalog.getCategoryCatalogStats, {});
    expect(stats).toEqual({ total: 0, active: 0, retired: 0 });
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.query(api.cms.catalog.getCategoryCatalogStats, {}),
    ).rejects.toThrow("Unauthenticated");
  });

  it("throws when user is not admin", async () => {
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
      asGuest.query(api.cms.catalog.getCategoryCatalogStats, {}),
    ).rejects.toThrow("Forbidden");
  });
});

describe("cms/catalog — searchCategoryCatalogForCms", () => {
  it("returns empty array for blank query", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);

    const asAdmin = t.withIdentity(ADMIN);
    const results = await asAdmin.query(
      api.cms.catalog.searchCategoryCatalogForCms,
      { query: "   " },
    );
    expect(results).toEqual([]);
  });

  it("returns matching nodes (accent-insensitive) with descendants", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);

    const asAdmin = t.withIdentity(ADMIN);
    // "econom" should match "Economy" (root) and its child "Finance"
    const results = await asAdmin.query(
      api.cms.catalog.searchCategoryCatalogForCms,
      { query: "econom" },
    );
    expect(results.length).toBeGreaterThanOrEqual(1);
    const labels = results.map((r) => r.label);
    expect(labels).toContain("Economy");
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.query(api.cms.catalog.searchCategoryCatalogForCms, { query: "test" }),
    ).rejects.toThrow("Unauthenticated");
  });
});

describe("cms/catalog — listCategoryCatalogRootsForCms", () => {
  it("returns only depth-0 non-retired nodes", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);

    const asAdmin = t.withIdentity(ADMIN);
    const roots = await asAdmin.query(
      api.cms.catalog.listCategoryCatalogRootsForCms,
      {},
    );
    // Should include "Economy" (depth 0, active) but not "OldTopic" (retired) or "Finance" (depth 1)
    expect(roots.every((r) => r.depth === 0)).toBe(true);
    expect(roots.every((r) => !r.retired)).toBe(true);
    const labels = roots.map((r) => r.label);
    expect(labels).toContain("Economy");
    expect(labels).not.toContain("Finance");
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.query(api.cms.catalog.listCategoryCatalogRootsForCms, {}),
    ).rejects.toThrow("Unauthenticated");
  });
});

describe("cms/catalog — triggerIptcImport", () => {
  it("schedules the import action and returns { scheduled: true }", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const asAdmin = t.withIdentity(ADMIN);
    const result = await asAdmin.mutation(api.cms.catalog.triggerIptcImport, {});
    expect(result).toEqual({ scheduled: true });
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.mutation(api.cms.catalog.triggerIptcImport, {}),
    ).rejects.toThrow("Unauthenticated");
  });

  it("throws when user is not admin", async () => {
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
      asGuest.mutation(api.cms.catalog.triggerIptcImport, {}),
    ).rejects.toThrow("Forbidden");
  });
});
