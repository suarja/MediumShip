/**
 * Pure TypeScript tree utilities for category hierarchies.
 * Used by both the platform catalog (categoryCatalog) and tenant taxonomy
 * (categories). No Convex runtime dependencies — fully testable as plain TS.
 */

import { normalizeScoringKey } from "../discovery/scoring";

export type TreeNode = {
  id: string;
  parentId?: string | null;
  depth: number;
  label: string;
  /** Extra labels to match (e.g. localized alt). Primary display still uses `label`. */
  altLabels?: string[];
};

/**
 * Normalise a search query: strip accents, lowercase, collapse non-alphanumeric
 * runs to spaces. Uses the same NFD pipeline as normalizeScoringKey but keeps
 * spaces instead of hyphens so substring matching feels natural.
 */
export function normalizeSearchQuery(query: string): string {
  return normalizeScoringKey(query).replace(/-/g, " ").trim();
}

/**
 * Build an ordered list of descendants starting at `rootId`, including the
 * root itself, capped at `maxDepth` levels below the root.
 *
 * Traversal order: root → children (label-sorted) → grandchildren, etc.
 * Nodes deeper than root.depth + maxDepth are excluded.
 */
export function buildSubtree<T extends TreeNode>(
  nodes: T[],
  rootId: string,
  maxDepth: number = 3,
): T[] {
  const nodeMap = new Map<string, T>(nodes.map((n) => [n.id, n]));
  const byParent = new Map<string, T[]>();

  for (const node of nodes) {
    const pid = node.parentId ?? null;
    if (pid !== null) {
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(node);
    }
  }

  const root = nodeMap.get(rootId);
  if (!root) return [];

  const rootDepth = root.depth;
  const result: T[] = [];

  function traverse(id: string): void {
    const node = nodeMap.get(id);
    if (!node) return;
    result.push(node);

    if (node.depth - rootDepth >= maxDepth) return;

    const children = (byParent.get(id) ?? []).slice().sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    for (const child of children) {
      traverse(child.id);
    }
  }

  traverse(rootId);
  return result;
}

/**
 * Given a flat node list and a search query, find all nodes whose normalised
 * label contains the normalised query, then return each match plus its subtree
 * capped at `maxDepth` levels. Duplicates across match subtrees are deduplicated.
 *
 * Returns an empty array when the query normalises to an empty string.
 */
export function buildSearchResults<T extends TreeNode>(
  nodes: T[],
  query: string,
  maxDepth: number = 3,
): T[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];

  const matchIds = nodes
    .filter((n) => {
      const haystacks = [n.label, ...(n.altLabels ?? [])];
      return haystacks.some((label) =>
        normalizeSearchQuery(label).includes(normalized),
      );
    })
    .map((n) => n.id);

  const seen = new Set<string>();
  const result: T[] = [];

  for (const matchId of matchIds) {
    for (const node of buildSubtree(nodes, matchId, maxDepth)) {
      if (!seen.has(node.id)) {
        seen.add(node.id);
        result.push(node);
      }
    }
  }

  return result;
}
