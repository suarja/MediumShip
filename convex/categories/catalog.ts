import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { normalizeScoringKey } from "../discovery/scoring";
import { buildSearchResults, buildSubtree, normalizeSearchQuery, type TreeNode } from "./tree";
import { CATALOG_TAXONOMY_MAX_DEPTH } from "./catalogLabelPolicy";

// ─── Upsert (called by the IPTC import action) ────────────────────────────────

const rawNodeValidator = v.object({
  externalId: v.string(),
  label: v.string(),
  labelFr: v.optional(v.string()),
  parentExternalId: v.optional(v.string()),
  retired: v.boolean(),
});

/**
 * Idempotent upsert of catalog nodes parsed from the IPTC source.
 * Three-pass strategy:
 *   1. Upsert all nodes without parent links (depth = 0 placeholder).
 *   2. Resolve externalId → _id mapping (existing + newly inserted).
 *   3. Patch each node with its correct parentId + depth.
 */
export const upsertCatalogNodes = internalMutation({
  args: { nodes: v.array(rawNodeValidator) },
  handler: async (ctx, args) => {
    if (args.nodes.length === 0) return 0;

    // Pass 1 — load existing externalId map
    const existingRows = await ctx.db.query("categoryCatalog").take(5000);
    const externalToId = new Map<string, Id<"categoryCatalog">>(
      existingRows.map((r) => [r.externalId, r._id]),
    );

    // Pass 2 — upsert every node (no parentId yet)
    for (const node of args.nodes) {
      const existingId = externalToId.get(node.externalId);
      const slug = normalizeScoringKey(node.label);
      if (existingId) {
        await ctx.db.patch(existingId, {
          label: node.label,
          slug,
          retired: node.retired,
          ...(node.labelFr !== undefined && { labelFr: node.labelFr }),
        });
      } else {
        const newId = await ctx.db.insert("categoryCatalog", {
          externalId: node.externalId,
          label: node.label,
          slug,
          depth: 0,
          retired: node.retired,
          ...(node.labelFr !== undefined && { labelFr: node.labelFr }),
        });
        externalToId.set(node.externalId, newId);
      }
    }

    // Pass 3 — resolve parentId links and set depth.
    // Process in topological order: nodes without a parent first, then children.
    const byExternalId = new Map(args.nodes.map((n) => [n.externalId, n]));
    const processed = new Set<string>();

    function computeDepth(externalId: string, visited = new Set<string>()): number {
      if (visited.has(externalId)) return 0; // cycle guard
      const node = byExternalId.get(externalId);
      if (!node?.parentExternalId) return 0;
      visited.add(externalId);
      return 1 + computeDepth(node.parentExternalId, visited);
    }

    for (const node of args.nodes) {
      const nodeId = externalToId.get(node.externalId);
      if (!nodeId) continue;
      if (processed.has(node.externalId)) continue;

      const depth = computeDepth(node.externalId);
      const parentId = node.parentExternalId
        ? externalToId.get(node.parentExternalId)
        : undefined;

      await ctx.db.patch(nodeId, { depth, parentId });
      processed.add(node.externalId);
    }

    return args.nodes.length;
  },
});

// ─── Catalog queries ──────────────────────────────────────────────────────────

/** Return depth-0 (root) catalog nodes, sorted by label. */
export const listCategoryCatalogRoots = internalQuery({
  args: {},
  handler: async (ctx) => {
    const roots = await ctx.db
      .query("categoryCatalog")
      .withIndex("by_depth", (q) => q.eq("depth", 0))
      .take(200);
    return roots
      .filter((n) => !n.retired)
      .sort((a, b) => a.label.localeCompare(b.label));
  },
});

/** Return direct children of a catalog node, sorted by label. */
export const listCategoryCatalogChildren = internalQuery({
  args: { parentId: v.id("categoryCatalog") },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("categoryCatalog")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .take(200);
    return children
      .filter((n) => !n.retired)
      .sort((a, b) => a.label.localeCompare(b.label));
  },
});

/**
 * Search catalog nodes by label (accent-insensitive).
 * Returns each matching node plus its subtree capped at `maxDepth` levels.
 */
export const searchCategoryCatalog = internalQuery({
  args: {
    query: v.string(),
    maxDepth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cap = args.maxDepth ?? CATALOG_TAXONOMY_MAX_DEPTH;
    const normalized = normalizeSearchQuery(args.query);
    if (!normalized) return [];

    // Load the full catalog into memory — ~1200 nodes is bounded and acceptable.
    // Performance note (ADR 0007): revisit with a server-side cache if needed.
    const allNodes = await ctx.db.query("categoryCatalog").take(5000);
    const active = allNodes.filter((n) => !n.retired);

    const treeNodes: TreeNode[] = active.map((n) => ({
      id: n._id as string,
      parentId: n.parentId ? (n.parentId as string) : null,
      depth: n.depth,
      label: n.label,
    }));

    const resultIds = new Set(
      buildSearchResults(treeNodes, args.query, cap).map((n) => n.id),
    );

    const nodeById = new Map(active.map((n) => [n._id as string, n]));
    return [...resultIds].map((id) => nodeById.get(id)).filter(Boolean);
  },
});

// ─── Internal helper — load subtree for addCategoryFromCatalog ────────────────

/**
 * Return a catalog node plus all its descendants ordered root→leaf.
 * Used by `addCategoryFromCatalog` to copy a subtree into a tenant taxonomy.
 */
export const getCatalogSubtree = internalQuery({
  args: {
    rootId: v.id("categoryCatalog"),
    maxDepth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cap = args.maxDepth ?? 99; // load full subtree by default
    const root = await ctx.db.get(args.rootId);
    if (!root) return [];

    const allNodes = await ctx.db.query("categoryCatalog").take(5000);
    const treeNodes: TreeNode[] = allNodes.map((n) => ({
      id: n._id as string,
      parentId: n.parentId ? (n.parentId as string) : null,
      depth: n.depth,
      label: n.label,
    }));

    const subtreeIds = new Set(
      buildSubtree(treeNodes, args.rootId as string, cap).map((n) => n.id),
    );

    const nodeById = new Map(allNodes.map((n) => [n._id as string, n]));
    return [...subtreeIds].map((id) => nodeById.get(id)).filter(Boolean);
  },
});
