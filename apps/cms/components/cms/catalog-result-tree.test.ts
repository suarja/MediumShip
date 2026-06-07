import { describe, expect, it } from "@jest/globals";

import { buildCatalogResultTreeIndex } from "./catalog-result-tree";

describe("buildCatalogResultTreeIndex", () => {
  const nodes = [
    { _id: "root", depth: 0 },
    { _id: "child", parentId: "root", depth: 1 },
    { _id: "grandchild", parentId: "child", depth: 2 },
  ];

  it("detects children within the visible result set", () => {
    const tree = buildCatalogResultTreeIndex(nodes);
    expect(tree.hasChildren("root")).toBe(true);
    expect(tree.hasChildren("child")).toBe(true);
    expect(tree.hasChildren("grandchild")).toBe(false);
  });

  it("hides descendants when an ancestor is collapsed", () => {
    const tree = buildCatalogResultTreeIndex(nodes);
    const collapsed = new Set(["root"]);

    expect(tree.isVisible(nodes[0]!, collapsed)).toBe(true);
    expect(tree.isVisible(nodes[1]!, collapsed)).toBe(false);
    expect(tree.isVisible(nodes[2]!, collapsed)).toBe(false);
  });
});
