import type { Id } from "../../../convex/_generated/dataModel";

export type PickerCategoryNode = {
  _id: Id<"categories">;
  label: string;
  iconKey: string;
  parentId?: Id<"categories">;
  depth: number;
};

function nodeKey(id: Id<"categories">) {
  return String(id);
}

export function buildCategoryPickerTree(nodes: PickerCategoryNode[]) {
  const ids = new Set(nodes.map((node) => nodeKey(node._id)));
  const childrenByParent = new Map<string, PickerCategoryNode[]>();

  for (const node of nodes) {
    if (node.parentId && ids.has(nodeKey(node.parentId))) {
      const parentKey = nodeKey(node.parentId);
      const siblings = childrenByParent.get(parentKey) ?? [];
      siblings.push(node);
      childrenByParent.set(parentKey, siblings);
    }
  }

  for (const children of childrenByParent.values()) {
    children.sort((left, right) => left.label.localeCompare(right.label));
  }

  const roots = nodes
    .filter((node) => !node.parentId || !ids.has(nodeKey(node.parentId)))
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
    for (const node of childrenByParent.get(nodeKey(focusStack[0])) ?? []) {
      entries.push({ node, level: 1 });
    }
  }

  if (focusStack[1]) {
    for (const node of childrenByParent.get(nodeKey(focusStack[1])) ?? []) {
      entries.push({ node, level: 2 });
    }
  }

  return entries;
}

export function nodeHasChildren(
  nodeId: Id<"categories">,
  childrenByParent: Map<string, PickerCategoryNode[]>,
) {
  return (childrenByParent.get(nodeKey(nodeId))?.length ?? 0) > 0;
}
