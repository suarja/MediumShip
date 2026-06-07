/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { parseIptcJson, type RawIptcNode } from "./catalogImportParse";
import fixture from "./fixtures/iptc-mediatopic-sample.json";

const TENANT = "demo-media";
const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };

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

/** Seed the catalog from the fixture and return the catalog rows. */
async function seedCatalog(t: ReturnType<typeof convexTest>) {
  const nodes = parseIptcJson(fixture) as RawIptcNode[];
  await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });
  return t.run((ctx) => ctx.db.query("categoryCatalog").collect());
}

// ─── listTenantCategoryRoots ──────────────────────────────────────────────────

describe("listTenantCategoryRoots", () => {
  it("returns only root-level (no parentId) tenant categories", async () => {
    const t = convexTest(schema, modules);

    const rootId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Economy",
        slug: "economy",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: Date.now(),
        depth: 0,
        isSelectable: true,
      });
      // Child should not appear in roots
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Investments",
        slug: "investments",
        iconKey: "default",
        sortOrder: 1,
        updatedAt: Date.now(),
        depth: 1,
        parentId: id,
        isSelectable: true,
      });
      return id;
    });

    const roots = await t.query(api.categories.queries.listTenantCategoryRoots, {
      tenantSlug: TENANT,
    });

    expect(roots).toHaveLength(1);
    expect(roots[0]?._id).toBe(rootId);
    expect(roots[0]?.label).toBe("Economy");
  });

  it("excludes non-selectable nodes", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Hidden",
        slug: "hidden",
        iconKey: "default",
        sortOrder: 0,
        updatedAt: Date.now(),
        isSelectable: false,
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Visible",
        slug: "visible",
        iconKey: "default",
        sortOrder: 1,
        updatedAt: Date.now(),
        isSelectable: true,
      });
    });

    const roots = await t.query(api.categories.queries.listTenantCategoryRoots, {
      tenantSlug: TENANT,
    });

    expect(roots).toHaveLength(1);
    expect(roots[0]?.label).toBe("Visible");
  });

  it("includes legacy categories (no isSelectable field) as selectable", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // Legacy row — no isSelectable field
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Legacy",
        slug: "legacy",
        iconKey: "default",
        sortOrder: 0,
        updatedAt: Date.now(),
      });
    });

    const roots = await t.query(api.categories.queries.listTenantCategoryRoots, {
      tenantSlug: TENANT,
    });
    expect(roots).toHaveLength(1);
    expect(roots[0]?.label).toBe("Legacy");
  });

  it("includes orphan nodes whose parent is missing from the tenant", async () => {
    const t = convexTest(schema, modules);

    const orphanId = await t.run(async (ctx) => {
      const missingParentId = await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Missing parent placeholder",
        slug: "missing-parent",
        iconKey: "default",
        sortOrder: 0,
        updatedAt: Date.now(),
        isSelectable: true,
      });
      await ctx.db.delete(missingParentId);

      return await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Roman",
        slug: "roman",
        iconKey: "culture",
        sortOrder: 1,
        updatedAt: Date.now(),
        parentId: missingParentId,
        depth: 2,
        isSelectable: true,
      });
    });

    const roots = await t.query(api.categories.queries.listTenantCategoryRoots, {
      tenantSlug: TENANT,
    });

    expect(roots).toHaveLength(1);
    expect(roots[0]?._id).toBe(orphanId);
    expect(roots[0]?.label).toBe("Roman");
  });
});

// ─── listTenantCategoryChildren ───────────────────────────────────────────────

describe("listTenantCategoryChildren", () => {
  it("returns direct children of a tenant category", async () => {
    const t = convexTest(schema, modules);

    const { rootId, childId } = await t.run(async (ctx) => {
      const root = await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Economy",
        slug: "economy",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: Date.now(),
        depth: 0,
      });
      const child = await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Investments",
        slug: "investments",
        iconKey: "default",
        sortOrder: 1,
        updatedAt: Date.now(),
        depth: 1,
        parentId: root,
        isSelectable: true,
      });
      return { rootId: root, childId: child };
    });

    const children = await t.query(
      api.categories.queries.listTenantCategoryChildren,
      { tenantSlug: TENANT, parentId: rootId },
    );

    expect(children).toHaveLength(1);
    expect(children[0]?._id).toBe(childId);
  });

  it("returns empty array for a leaf node", async () => {
    const t = convexTest(schema, modules);

    const leafId = await t.run((ctx) =>
      ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Leaf",
        slug: "leaf",
        iconKey: "default",
        sortOrder: 0,
        updatedAt: Date.now(),
      }),
    );

    const children = await t.query(
      api.categories.queries.listTenantCategoryChildren,
      { tenantSlug: TENANT, parentId: leafId },
    );
    expect(children).toHaveLength(0);
  });
});

// ─── searchTenantCategories ───────────────────────────────────────────────────

describe("searchTenantCategories", () => {
  it("returns the matching node plus its subtree", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const rootId = await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Economy, Business and Finance",
        slug: "economy",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: Date.now(),
        depth: 0,
        isSelectable: true,
      });
      await ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Investments",
        slug: "investments",
        iconKey: "default",
        sortOrder: 1,
        updatedAt: Date.now(),
        depth: 1,
        parentId: rootId,
        isSelectable: true,
      });
    });

    const results = await t.query(api.categories.queries.searchTenantCategories, {
      tenantSlug: TENANT,
      query: "econom",
    });

    const labels = results.map((r) => r!.label);
    expect(labels).toContain("Economy, Business and Finance");
    expect(labels).toContain("Investments");
  });

  it("is accent-insensitive", async () => {
    const t = convexTest(schema, modules);

    await t.run((ctx) =>
      ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Économie",
        slug: "economie",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: Date.now(),
        depth: 0,
        isSelectable: true,
      }),
    );

    const results = await t.query(api.categories.queries.searchTenantCategories, {
      tenantSlug: TENANT,
      query: "economie",
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.label).toBe("Économie");
  });

  it("returns empty array when no node matches", async () => {
    const t = convexTest(schema, modules);

    await t.run((ctx) =>
      ctx.db.insert("categories", {
        tenantSlug: TENANT,
        label: "Economy",
        slug: "economy",
        iconKey: "economy",
        sortOrder: 0,
        updatedAt: Date.now(),
      }),
    );

    const results = await t.query(api.categories.queries.searchTenantCategories, {
      tenantSlug: TENANT,
      query: "sports",
    });
    expect(results).toHaveLength(0);
  });
});

// ─── addCategoryFromCatalog ───────────────────────────────────────────────────

describe("addCategoryFromCatalog", () => {
  it("copies a depth-1 catalog node into tenant categories", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const catalogRows = await seedCatalog(t);

    const investments = catalogRows.find((r) => r.externalId === "medtop:20000346")!;
    expect(investments).toBeDefined();

    const asAdmin = t.withIdentity(ADMIN);
    const result = await asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
      tenantSlug: TENANT,
      catalogNodeId: investments._id,
      includeDescendants: false,
    });

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);

    const tenantRows = await t.run((ctx) =>
      ctx.db
        .query("categories")
        .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", TENANT))
        .collect(),
    );
    expect(tenantRows).toHaveLength(1);
    expect(tenantRows[0]?.label).toBe("Investments");
    expect(tenantRows[0]?.catalogNodeId).toBe(investments._id);
    expect(tenantRows[0]?.depth).toBe(1);
    expect(tenantRows[0]?.isSelectable).toBe(true);
    expect(tenantRows[0]?.iconKey).not.toBe("default");
  });

  it("rejects IPTC root nodes (depth 0)", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const catalogRows = await seedCatalog(t);
    const economy = catalogRows.find((r) => r.externalId === "medtop:20000344")!;
    const asAdmin = t.withIdentity(ADMIN);

    await expect(
      asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
        tenantSlug: TENANT,
        catalogNodeId: economy._id,
      }),
    ).rejects.toThrow("trop larges");
  });

  it("copies a subtree with includeDescendants=true, remapping parentId", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const catalogRows = await seedCatalog(t);

    const investments = catalogRows.find((r) => r.externalId === "medtop:20000346")!;
    const asAdmin = t.withIdentity(ADMIN);

    await asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
      tenantSlug: TENANT,
      catalogNodeId: investments._id,
      includeDescendants: true,
    });

    const tenantRows = await t.run((ctx) =>
      ctx.db
        .query("categories")
        .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", TENANT))
        .collect(),
    );

    const labels = tenantRows.map((r) => r.label);
    expect(labels).toContain("Investments");
    expect(labels).toContain("ETF");
    expect(labels).not.toContain("Economy, Business and Finance");

    const investmentsTenant = tenantRows.find((r) => r.label === "Investments")!;
    const etfTenant = tenantRows.find((r) => r.label === "ETF")!;
    expect(etfTenant?.parentId).toBe(investmentsTenant?._id);
    expect(etfTenant?.depth).toBe(2);
    expect(investmentsTenant?.iconKey).not.toBe("default");
    expect(etfTenant?.iconKey).not.toBe("default");
    expect(investmentsTenant?.iconKey).not.toBe(etfTenant?.iconKey);
  });

  it("skips duplicate slugs on re-run (idempotent)", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const catalogRows = await seedCatalog(t);

    const investments = catalogRows.find((r) => r.externalId === "medtop:20000346")!;
    const asAdmin = t.withIdentity(ADMIN);

    const first = await asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
      tenantSlug: TENANT,
      catalogNodeId: investments._id,
    });
    const second = await asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
      tenantSlug: TENANT,
      catalogNodeId: investments._id,
    });

    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);

    const tenantRows = await t.run((ctx) =>
      ctx.db
        .query("categories")
        .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", TENANT))
        .collect(),
    );
    expect(tenantRows).toHaveLength(1); // no duplicates
  });

  it("rejects non-admin callers", async () => {
    const t = convexTest(schema, modules);
    const catalogRows = await seedCatalog(t);
    const investments = catalogRows.find((r) => r.externalId === "medtop:20000346")!;

    const asMember = t.withIdentity({
      subject: "member_1",
      tokenIdentifier: "token_member",
    });

    await expect(
      asMember.mutation(api.cms.categories.addCategoryFromCatalog, {
        tenantSlug: TENANT,
        catalogNodeId: investments._id,
      }),
    ).rejects.toThrow();
  });
});

// ─── Slice I regression ───────────────────────────────────────────────────────

describe("Slice I regression — setCategoryInterests + getDiscoveryFeed", () => {
  it("categoryInterests still stores keys and getMyCategoryInterests returns them", async () => {
    const t = convexTest(schema, modules);
    const asMember = t.withIdentity({
      subject: "member_1",
      tokenIdentifier: "token_member",
    });

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Economy", "Culture"],
    });

    const interests = await asMember.query(
      api.categories.interests.getMyCategoryInterests,
      { tenantSlug: TENANT },
    );

    expect(interests.sort()).toEqual(["culture", "economy"]);
  });

  it("addCategoryFromCatalog does not break Slice I interest picks", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const catalogRows = await seedCatalog(t);

    const investments = catalogRows.find((r) => r.externalId === "medtop:20000346")!;
    const asAdmin = t.withIdentity(ADMIN);

    await asAdmin.mutation(api.cms.categories.addCategoryFromCatalog, {
      tenantSlug: TENANT,
      catalogNodeId: investments._id,
      includeDescendants: false,
    });

    const asMember = t.withIdentity({
      subject: "member_1",
      tokenIdentifier: "token_member",
    });

    await asMember.mutation(api.categories.interests.setCategoryInterests, {
      tenantSlug: TENANT,
      categoryKeys: ["Investments"],
    });

    const interests = await asMember.query(
      api.categories.interests.getMyCategoryInterests,
      { tenantSlug: TENANT },
    );
    expect(interests).toContain("investments");
  });
});
