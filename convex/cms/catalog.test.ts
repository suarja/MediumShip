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
    expect(stats).toEqual({ total: 0, active: 0, retired: 0, withFrench: 0 });
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

  it("excludes root nodes and returns addable children", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);

    const asAdmin = t.withIdentity(ADMIN);
    const results = await asAdmin.query(
      api.cms.catalog.searchCategoryCatalogForCms,
      { query: "econom" },
    );
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.depth >= 1)).toBe(true);
    expect(results.every((r) => r.canAdd)).toBe(true);
    const labels = results.map((r) => r.label);
    expect(labels).toContain("Finance");
    expect(labels).not.toContain("Economy");
  });

  it("matches French labels when present", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("categoryCatalog", {
        externalId: "medtop:20000010",
        label: "Sport",
        labelFr: "Sport",
        slug: "sport",
        depth: 1,
        retired: false,
      });
      await ctx.db.insert("tenants", {
        slug: "demo-media",
        name: "Demo",
        enabledModules: [],
        catalogLocale: "fr",
      });
    });

    const asAdmin = t.withIdentity(ADMIN);
    const results = await asAdmin.query(
      api.cms.catalog.searchCategoryCatalogForCms,
      { query: "sport" },
    );
    expect(results.some((r) => r.displayLabel === "Sport")).toBe(true);
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    await expect(
      t.query(api.cms.catalog.searchCategoryCatalogForCms, { query: "test" }),
    ).rejects.toThrow("Unauthenticated");
  });
});

describe("cms/catalog — updateDiscoveryLocales", () => {
  it("persists catalog and wikipedia locales on tenant", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const asAdmin = t.withIdentity(ADMIN);
    await asAdmin.mutation(api.cms.catalog.updateDiscoveryLocales, {
      catalogLocale: "fr",
      wikipediaLocale: "fr",
    });

    const locales = await asAdmin.query(api.cms.catalog.getDiscoveryLocales, {});
    expect(locales).toEqual({
      catalogLocale: "fr",
      wikipediaLocale: "fr",
    });
  });

  it("allows updating only catalogLocale", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const asAdmin = t.withIdentity(ADMIN);
    await asAdmin.mutation(api.cms.catalog.updateDiscoveryLocales, {
      catalogLocale: "fr",
      wikipediaLocale: "en",
    });
    await asAdmin.mutation(api.cms.catalog.updateDiscoveryLocales, {
      catalogLocale: "en",
    });

    const locales = await asAdmin.query(api.cms.catalog.getDiscoveryLocales, {});
    expect(locales).toEqual({
      catalogLocale: "en",
      wikipediaLocale: "en",
    });
  });
});

describe("cms/catalog — listCategoryCatalogRootsForCms", () => {
  it("returns localized L1 families for browse chips", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    await seedCatalogNodes(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: "demo-media",
        name: "Demo",
        enabledModules: [],
        catalogLocale: "en",
      });
    });

    const asAdmin = t.withIdentity(ADMIN);
    const roots = await asAdmin.query(
      api.cms.catalog.listCategoryCatalogRootsForCms,
      {},
    );
    expect(roots.every((r) => r.depth === 0)).toBe(true);
    expect(roots.every((r) => !r.canAdd)).toBe(true);
    expect(roots.map((r) => r.label)).toContain("Economy");
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
