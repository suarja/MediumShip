export type CatalogResultNode = {
  _id: string;
  parentId?: string;
  depth: number;
};

export function buildCatalogResultTreeIndex<T extends CatalogResultNode>(nodes: T[]) {
  const nodeById = new Map(nodes.map((node) => [node._id, node]));
  const childCountById = new Map<string, number>();

  for (const node of nodes) {
    if (!node.parentId) continue;
    if (!nodeById.has(node.parentId)) continue;
    childCountById.set(
      node.parentId,
      (childCountById.get(node.parentId) ?? 0) + 1,
    );
  }

  return {
    nodeById,
    hasChildren(nodeId: string) {
      return (childCountById.get(nodeId) ?? 0) > 0;
    },
    isVisible(node: T, collapsedIds: ReadonlySet<string>) {
      let parentId = node.parentId;
      while (parentId) {
        if (collapsedIds.has(parentId)) return false;
        parentId = nodeById.get(parentId)?.parentId;
      }
      return true;
    },
  };
}
