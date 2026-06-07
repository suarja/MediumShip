import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { canAddCatalogNodeToTenant } from "./catalogLabelPolicy";
import {
  type CatalogLocale,
  resolveCatalogDisplayLabel,
} from "./catalogLocale";
import type { CatalogNodeSummary } from "./catalogRead";
import { buildSubtree, type TreeNode } from "./tree";

function tenantRowMatchesCatalogNode(
  row: Doc<"categories">,
  catalogNode: Doc<"categoryCatalog">,
  displayLabel: string,
): boolean {
  return (
    row.catalogNodeId === catalogNode._id ||
    row.slug === catalogNode.slug ||
    row.slug === displayLabel.toLowerCase().replace(/\s+/g, "-")
  );
}

function copyableCatalogDescendantIds(
  catalogNodeId: string,
  catalogById: Map<string, Doc<"categoryCatalog">>,
  treeNodes: TreeNode[],
  locale: CatalogLocale,
): string[] {
  return buildSubtree(treeNodes, catalogNodeId, 99)
    .filter((node) => node.id !== catalogNodeId)
    .map((node) => catalogById.get(node.id))
    .filter((node): node is Doc<"categoryCatalog"> => node !== undefined)
    .filter((node) =>
      canAddCatalogNodeToTenant(
        node.depth,
        resolveCatalogDisplayLabel(node, locale),
      ),
    )
    .map((node) => node._id as string);
}

export function enrichCatalogSummariesWithTenantStatus(
  summaries: CatalogNodeSummary[],
  tenantRows: Doc<"categories">[],
  catalogNodes: Doc<"categoryCatalog">[],
  locale: CatalogLocale,
): CatalogNodeSummary[] {
  const catalogById = new Map(catalogNodes.map((node) => [node._id as string, node]));
  const treeNodes: TreeNode[] = catalogNodes.map((node) => ({
    id: node._id as string,
    parentId: node.parentId ? (node.parentId as string) : null,
    depth: node.depth,
    label: node.label,
    altLabels: node.labelFr ? [node.labelFr] : undefined,
  }));

  const descendantStatusCache = new Map<string, boolean>();

  function descendantsFullyInTenant(catalogNodeId: string): boolean {
    const cached = descendantStatusCache.get(catalogNodeId);
    if (cached !== undefined) return cached;

    const descendantIds = copyableCatalogDescendantIds(
      catalogNodeId,
      catalogById,
      treeNodes,
      locale,
    );
    if (descendantIds.length === 0) {
      descendantStatusCache.set(catalogNodeId, false);
      return false;
    }

    const complete = descendantIds.every((descendantId) => {
      const catalogNode = catalogById.get(descendantId);
      if (!catalogNode) return false;
      const displayLabel = resolveCatalogDisplayLabel(catalogNode, locale);
      return tenantRows.some((row) =>
        tenantRowMatchesCatalogNode(row, catalogNode, displayLabel),
      );
    });
    descendantStatusCache.set(catalogNodeId, complete);
    return complete;
  }

  return summaries.map((summary) => {
    const catalogNode = catalogById.get(summary._id);
    const inTenant =
      catalogNode !== undefined &&
      tenantRows.some((row) =>
        tenantRowMatchesCatalogNode(
          row,
          catalogNode,
          summary.displayLabel,
        ),
      );

    return {
      ...summary,
      inTenant,
      descendantsFullyInTenant: descendantsFullyInTenant(summary._id),
    };
  });
}

export async function loadCatalogTenantStatusContext(
  ctx: QueryCtx,
  tenantSlug: string,
) {
  const [tenantRows, catalogNodes] = await Promise.all([
    ctx.db
      .query("categories")
      .withIndex("by_tenantSlug", (q) => q.eq("tenantSlug", tenantSlug))
      .collect(),
    ctx.db.query("categoryCatalog").take(5000),
  ]);

  return { tenantRows, catalogNodes };
}

export function resolveCatalogNodesToRemove(
  catalogNodeId: string,
  catalogNodes: Doc<"categoryCatalog">[],
  locale: CatalogLocale,
  options: { includeDescendants: boolean; excludeSelf: boolean },
): Doc<"categoryCatalog">[] {
  const catalogById = new Map(catalogNodes.map((node) => [node._id as string, node]));
  const treeNodes: TreeNode[] = catalogNodes.map((node) => ({
    id: node._id as string,
    parentId: node.parentId ? (node.parentId as string) : null,
    depth: node.depth,
    label: node.label,
  }));

  const subtreeIds = new Set(
    buildSubtree(treeNodes, catalogNodeId, 99).map((node) => node.id),
  );

  if (!options.includeDescendants) {
    const root = catalogById.get(catalogNodeId);
    return root ? [root] : [];
  }

  return [...subtreeIds]
    .filter((id) => !(options.excludeSelf && id === catalogNodeId))
    .map((id) => catalogById.get(id))
    .filter((node): node is Doc<"categoryCatalog"> => node !== undefined)
    .filter((node) =>
      canAddCatalogNodeToTenant(
        node.depth,
        resolveCatalogDisplayLabel(node, locale),
      ),
    );
}
