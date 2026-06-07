import type { Id } from "../../../convex/_generated/dataModel";
import { normalizeScoringKey } from "../../../convex/discovery/scoring";
import { nodeHasChildren, type PickerCategoryNode } from "./category-interest-tree";

export type CloudEntry = {
  node: PickerCategoryNode;
  level: number;
  /** Child chip orbiting an expanded parent in the same flex row. */
  satellite: boolean;
};

function nodeIdKey(id: Id<"categories">) {
  return String(id);
}

function getChildren(
  parentId: Id<"categories">,
  childrenByParent: Map<string, PickerCategoryNode[]>,
) {
  return childrenByParent.get(nodeIdKey(parentId)) ?? [];
}

/** Parents whose children should show on first load — picked interests with descendants. */
export function buildInitialRevealedAnchors(
  nodes: PickerCategoryNode[],
  childrenByParent: Map<string, PickerCategoryNode[]>,
  selectedKeys: ReadonlySet<string>,
): Set<string> {
  const revealed = new Set<string>();

  for (const node of nodes) {
    if (
      nodeHasChildren(node._id, childrenByParent) &&
      selectedKeys.has(normalizeScoringKey(node.label))
    ) {
      revealed.add(nodeIdKey(node._id));
    }
  }

  return revealed;
}

/** Split children left / right of the anchor chip inside the wrapping row. */
function entriesAroundAnchor(
  anchor: PickerCategoryNode,
  anchorLevel: number,
  children: PickerCategoryNode[],
  revealedAnchorIds: ReadonlySet<string>,
  childrenByParent: Map<string, PickerCategoryNode[]>,
): CloudEntry[] {
  const leftCount = Math.floor(children.length / 2);
  const leftChildren = children.slice(0, leftCount);
  const rightChildren = children.slice(leftCount);
  const entries: CloudEntry[] = [];

  const pushChild = (child: PickerCategoryNode) => {
    const nestedChildren = getChildren(child._id, childrenByParent);
    const isNestedRevealed =
      revealedAnchorIds.has(nodeIdKey(child._id)) && nestedChildren.length > 0;

    if (isNestedRevealed) {
      entries.push(
        ...entriesAroundAnchor(
          child,
          anchorLevel + 1,
          nestedChildren,
          revealedAnchorIds,
          childrenByParent,
        ),
      );
      return;
    }

    entries.push({
      node: child,
      level: anchorLevel + 1,
      satellite: true,
    });
  };

  for (const child of leftChildren) {
    pushChild(child);
  }

  entries.push({
    node: anchor,
    level: anchorLevel,
    satellite: false,
  });

  for (const child of rightChildren) {
    pushChild(child);
  }

  return entries;
}

/**
 * Flat flex-wrap cloud. Revealed parents keep their children woven inline
 * (left / right) for the whole session — independent of other parents.
 */
export function buildInlineCloudEntries(
  roots: PickerCategoryNode[],
  childrenByParent: Map<string, PickerCategoryNode[]>,
  revealedAnchorIds: ReadonlySet<string>,
): CloudEntry[] {
  const entries: CloudEntry[] = [];

  for (const root of roots) {
    const children = getChildren(root._id, childrenByParent);
    const isRevealed =
      revealedAnchorIds.has(nodeIdKey(root._id)) && children.length > 0;

    if (isRevealed) {
      entries.push(
        ...entriesAroundAnchor(
          root,
          0,
          children,
          revealedAnchorIds,
          childrenByParent,
        ),
      );
      continue;
    }

    entries.push({ node: root, level: 0, satellite: false });
  }

  return entries;
}

export function nodeIsExpandable(
  nodeId: Id<"categories">,
  childrenByParent: Map<string, PickerCategoryNode[]>,
) {
  return nodeHasChildren(nodeId, childrenByParent);
}
