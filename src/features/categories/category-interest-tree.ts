import type { Id } from "../../../convex/_generated/dataModel";

export type PickerCategoryNode = {
  _id: Id<"categories">;
  label: string;
  iconKey: string;
  parentId?: Id<"categories">;
  depth: number;
};

export function buildCategoryPickerTree(nodes: PickerCategoryNode[]) {
  const ids = new Set(nodes.map((node) => node._id));
  const childrenByParent = new Map<string, PickerCategoryNode[]>();

  for (const node of nodes) {
    if (node.parentId && ids.has(node.parentId)) {
      const siblings = childrenByParent.get(node.parentId) ?? [];
      siblings.push(node);
      childrenByParent.set(node.parentId, siblings);
    }
  }

  for (const children of childrenByParent.values()) {
    children.sort((left, right) => left.label.localeCompare(right.label));
  }

  const roots = nodes
    .filter((node) => !node.parentId || !ids.has(node.parentId))
    .sort((left, right) => left.label.localeCompare(right.label));

  return { roots, childrenByParent };
}

export function buildVisibleCategoryCloud(
  roots: PickerCategoryNode[],
  childrenByParent: Map<string, PickerCategoryNode[]>,
  focusStack: Id<"categories">[],
) {
  const entries: { node: PickerCategoryNode; level: number }[] = roots.map((node) => ({
    node,
    level: 0,
  }));

  if (focusStack[0]) {
    for (const node of childrenByParent.get(focusStack[0]) ?? []) {
      entries.push({ node, level: 1 });
    }
  }

  if (focusStack[1]) {
    for (const node of childrenByParent.get(focusStack[1]) ?? []) {
      entries.push({ node, level: 2 });
    }
  }

  return entries;
}

export function nodeHasChildren(
  nodeId: Id<"categories">,
  childrenByParent: Map<string, PickerCategoryNode[]>,
) {
  return (childrenByParent.get(nodeId)?.length ?? 0) > 0;
}
