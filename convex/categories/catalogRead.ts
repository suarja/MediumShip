import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
  type CatalogLocale,
  resolveCatalogDisplayLabel,
} from "./catalogLocale";
import { buildSearchResults, normalizeSearchQuery, type TreeNode } from "./tree";

export type CatalogNodeSummary = {
  _id: string;
  label: string;
  displayLabel: string;
  depth: number;
  externalId: string;
  slug: string;
  labelFr?: string;
  retired: boolean;
  /** Root nodes (depth 0) cannot be added to tenant taxonomy. */
  canAdd: boolean;
};

function toSummary(
  node: Doc<"categoryCatalog">,
  locale: CatalogLocale,
): CatalogNodeSummary {
  const displayLabel = resolveCatalogDisplayLabel(node, locale);
  return {
    _id: node._id as string,
    label: node.label,
    displayLabel,
    depth: node.depth,
    externalId: node.externalId,
    slug: node.slug,
    ...(node.labelFr !== undefined && { labelFr: node.labelFr }),
    retired: node.retired ?? false,
    canAdd: node.depth > 0,
  };
}

export async function readCategoryCatalogStats(ctx: QueryCtx) {
  const all = await ctx.db.query("categoryCatalog").take(5000);
  const retired = all.filter((n) => n.retired).length;
  const active = all.length - retired;
  return { total: all.length, active, retired };
}

export async function searchCategoryCatalogNodes(
  ctx: QueryCtx,
  query: string,
  options: {
    maxDepth?: number;
    minDepth?: number;
    locale?: CatalogLocale;
  } = {},
) {
  const maxDepth = options.maxDepth ?? 3;
  const minDepth = options.minDepth ?? 0;
  const locale = options.locale ?? "en";
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];

  const allNodes = await ctx.db.query("categoryCatalog").take(5000);
  const active = allNodes.filter((n) => !(n.retired ?? false));

  const treeNodes: TreeNode[] = active.map((n) => ({
    id: n._id as string,
    parentId: n.parentId ? (n.parentId as string) : null,
    depth: n.depth,
    label: n.label,
    altLabels: n.labelFr ? [n.labelFr] : undefined,
  }));

  const resultIds = new Set(
    buildSearchResults(treeNodes, query, maxDepth).map((n) => n.id),
  );

  const nodeById = new Map(active.map((n) => [n._id as string, n]));
  return [...resultIds]
    .map((id) => nodeById.get(id))
    .filter((node): node is Doc<"categoryCatalog"> => node !== undefined)
    .filter((node) => node.depth >= minDepth)
    .map((node) => toSummary(node, locale));
}
