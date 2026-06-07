/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { parseIptcJson, type RawIptcNode } from "./catalog-import";
import fixture from "./fixtures/iptc-mediatopic-sample.json";

// ─── parseIptcJson ────────────────────────────────────────────────────────────

describe("parseIptcJson", () => {
  it("parses root and child concepts from the sample fixture", () => {
    const nodes = parseIptcJson(fixture);
    const externalIds = nodes.map((n) => n.externalId);

    // Root nodes
    expect(externalIds).toContain("medtop:20000344");
    expect(externalIds).toContain("medtop:20000001");
    // Child nodes
    expect(externalIds).toContain("medtop:20000346");
    expect(externalIds).toContain("medtop:20000002");
    // Retired
    expect(externalIds).toContain("medtop:20000347");
    // ConceptScheme (not a Concept) must be excluded
    expect(externalIds).not.toContain("medtop:20000000");
  });

  it("maps English and French labels", () => {
    const nodes = parseIptcJson(fixture);
    const economy = nodes.find((n) => n.externalId === "medtop:20000344");
    expect(economy?.label).toBe("Economy, Business and Finance");
    expect(economy?.labelFr).toBe("Économie, Commerce et Finance");
  });

  it("resolves parent links via skos:broader", () => {
    const nodes = parseIptcJson(fixture);
    const investments = nodes.find((n) => n.externalId === "medtop:20000346");
    expect(investments?.parentExternalId).toBe("medtop:20000344");
    const etf = nodes.find((n) => n.externalId === "medtop:20000347");
    expect(etf?.parentExternalId).toBe("medtop:20000346");
  });

  it("marks owl:deprecated nodes as retired", () => {
    const nodes = parseIptcJson(fixture);
    const etf = nodes.find((n) => n.externalId === "medtop:20000347");
    expect(etf?.retired).toBe(true);
    const economy = nodes.find((n) => n.externalId === "medtop:20000344");
    expect(economy?.retired).toBe(false);
  });

  it("excludes nodes without an English label", () => {
    const noEnLabel = {
      "@context": {},
      "@graph": [
        {
          "@id": "http://cv.iptc.org/newscodes/mediatopic/99999",
          "@type": ["skos:Concept"],
          "skos:prefLabel": [{ "@language": "fr", "@value": "Sans anglais" }],
        },
      ],
    };
    const nodes = parseIptcJson(noEnLabel);
    expect(nodes).toHaveLength(0);
  });

  it("handles empty graph gracefully", () => {
    expect(parseIptcJson({ "@graph": [] })).toEqual([]);
    expect(parseIptcJson({})).toEqual([]);
  });
});

// ─── upsertCatalogNodes ───────────────────────────────────────────────────────

function parsedFixture(): RawIptcNode[] {
  return parseIptcJson(fixture) as RawIptcNode[];
}

describe("upsertCatalogNodes", () => {
  it("inserts parsed nodes into categoryCatalog", async () => {
    const t = convexTest(schema, modules);
    const nodes = parsedFixture();

    await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });

    const rows = await t.run((ctx) => ctx.db.query("categoryCatalog").collect());
    expect(rows.length).toBe(nodes.length);
  });

  it("resolves parentId links and sets depth", async () => {
    const t = convexTest(schema, modules);
    const nodes = parsedFixture();
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });

    const all = await t.run((ctx) => ctx.db.query("categoryCatalog").collect());
    const byExtId = new Map(all.map((r) => [r.externalId, r]));

    const economy = byExtId.get("medtop:20000344")!;
    expect(economy.depth).toBe(0);
    expect(economy.parentId).toBeUndefined();

    const investments = byExtId.get("medtop:20000346")!;
    expect(investments.depth).toBe(1);
    expect(investments.parentId).toBe(economy._id);

    const etf = byExtId.get("medtop:20000347")!;
    expect(etf.depth).toBe(2);
    expect(etf.parentId).toBe(investments._id);
  });

  it("is idempotent — re-running does not duplicate rows", async () => {
    const t = convexTest(schema, modules);
    const nodes = parsedFixture();
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });

    const rows = await t.run((ctx) => ctx.db.query("categoryCatalog").collect());
    expect(rows.length).toBe(nodes.length);
  });

  it("updates label on re-import without creating duplicates", async () => {
    const t = convexTest(schema, modules);
    const nodes = parsedFixture();
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, { nodes });

    const updatedNodes: RawIptcNode[] = nodes.map((n) =>
      n.externalId === "medtop:20000344"
        ? { ...n, label: "Economy (Updated)" }
        : n,
    );
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: updatedNodes,
    });

    const rows = await t.run((ctx) => ctx.db.query("categoryCatalog").collect());
    expect(rows.length).toBe(nodes.length); // no duplicates
    const updated = rows.find((r) => r.externalId === "medtop:20000344");
    expect(updated?.label).toBe("Economy (Updated)");
  });
});

// ─── listCategoryCatalogRoots ─────────────────────────────────────────────────

describe("listCategoryCatalogRoots", () => {
  it("returns only depth-0 non-retired nodes sorted by label", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const roots = await t.query(internal.categories.catalog.listCategoryCatalogRoots, {});
    expect(roots.every((r) => r.depth === 0)).toBe(true);
    expect(roots.every((r) => !r.retired)).toBe(true);
    // Labels should be sorted
    const labels = roots.map((r) => r.label);
    expect(labels).toEqual([...labels].sort());
  });
});

// ─── listCategoryCatalogChildren ──────────────────────────────────────────────

describe("listCategoryCatalogChildren", () => {
  it("returns direct children of a catalog node", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const roots = await t.query(internal.categories.catalog.listCategoryCatalogRoots, {});
    const economy = roots.find((r) => r.externalId === "medtop:20000344")!;
    expect(economy).toBeDefined();

    const children = await t.query(
      internal.categories.catalog.listCategoryCatalogChildren,
      { parentId: economy._id },
    );
    expect(children).toHaveLength(1);
    expect(children[0]?.externalId).toBe("medtop:20000346");
  });

  it("returns empty array for a leaf node", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const all = await t.run((ctx) => ctx.db.query("categoryCatalog").collect());
    const investments = all.find((r) => r.externalId === "medtop:20000346")!;

    // ETF is retired, so children of investments returns empty
    const children = await t.query(
      internal.categories.catalog.listCategoryCatalogChildren,
      { parentId: investments._id },
    );
    // ETF is retired → filtered out
    expect(children.filter((c) => !c.retired)).toHaveLength(0);
  });
});

// ─── searchCategoryCatalog ────────────────────────────────────────────────────

describe("searchCategoryCatalog", () => {
  it("returns the matching node plus its subtree", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const results = await t.query(
      internal.categories.catalog.searchCategoryCatalog,
      { query: "econom" },
    );
    const extIds = results.map((r) => r!.externalId);
    expect(extIds).toContain("medtop:20000344"); // Economy
    expect(extIds).toContain("medtop:20000346"); // Investments (child)
    // ETF is retired → excluded from results
    expect(extIds).not.toContain("medtop:20000347");
  });

  it("is accent-insensitive — économ matches Economy", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const results = await t.query(
      internal.categories.catalog.searchCategoryCatalog,
      { query: "économ" },
    );
    expect(results.map((r) => r!.externalId)).toContain("medtop:20000344");
  });

  it("returns empty array for a query with no match", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.categories.catalog.upsertCatalogNodes, {
      nodes: parsedFixture(),
    });

    const results = await t.query(
      internal.categories.catalog.searchCategoryCatalog,
      { query: "sports" },
    );
    expect(results).toHaveLength(0);
  });

  it("respects maxDepth when supplied", async () => {
    const t = convexTest(schema, modules);
    // Insert a 3-level tree manually so we can control depth
    await t.run(async (ctx) => {
      const rootId = await ctx.db.insert("categoryCatalog", {
        externalId: "test:root",
        label: "Technology",
        slug: "technology",
        depth: 0,
      });
      const childId = await ctx.db.insert("categoryCatalog", {
        externalId: "test:child",
        label: "Software",
        slug: "software",
        depth: 1,
        parentId: rootId,
      });
      await ctx.db.insert("categoryCatalog", {
        externalId: "test:grandchild",
        label: "Programming Languages",
        slug: "programming-languages",
        depth: 2,
        parentId: childId,
      });
    });

    const resultsDepth1 = await t.query(
      internal.categories.catalog.searchCategoryCatalog,
      { query: "technology", maxDepth: 1 },
    );
    const ids1 = resultsDepth1.map((r) => r!.externalId);
    expect(ids1).toContain("test:root");
    expect(ids1).toContain("test:child");
    expect(ids1).not.toContain("test:grandchild");

    const resultsDepth2 = await t.query(
      internal.categories.catalog.searchCategoryCatalog,
      { query: "technology", maxDepth: 2 },
    );
    expect(resultsDepth2.map((r) => r!.externalId)).toContain("test:grandchild");
  });
});
