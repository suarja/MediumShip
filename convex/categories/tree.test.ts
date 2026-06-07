/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import {
  buildSearchResults,
  buildSubtree,
  normalizeSearchQuery,
  type TreeNode,
} from "./tree";

// ─── helpers ──────────────────────────────────────────────────────────────────

function node(
  id: string,
  label: string,
  depth: number,
  parentId?: string,
): TreeNode {
  return { id, label, depth, parentId };
}

/**
 * Sample hierarchy:
 *   economy (0)
 *   ├─ investments (1)
 *   │   └─ etf (2)
 *   └─ trade (1)
 *   arts (0)
 */
const NODES: TreeNode[] = [
  node("economy", "Economy, Business and Finance", 0),
  node("investments", "Investments", 1, "economy"),
  node("etf", "ETF", 2, "investments"),
  node("trade", "Trade", 1, "economy"),
  node("arts", "Arts, Culture and Entertainment", 0),
];

// ─── normalizeSearchQuery ─────────────────────────────────────────────────────

describe("normalizeSearchQuery", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeSearchQuery("Économie")).toBe("economie");
    expect(normalizeSearchQuery("Société")).toBe("societe");
    expect(normalizeSearchQuery("Éducation")).toBe("education");
  });

  it("converts hyphens/punctuation to spaces", () => {
    expect(normalizeSearchQuery("  hello-world  ")).toBe("hello world");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});

// ─── buildSubtree ─────────────────────────────────────────────────────────────

describe("buildSubtree", () => {
  it("returns root + direct children + grandchildren with default maxDepth 4", () => {
    const subtree = buildSubtree(NODES, "economy");
    const ids = subtree.map((n) => n.id);
    expect(ids).toContain("economy");
    expect(ids).toContain("investments");
    expect(ids).toContain("etf");
    expect(ids).toContain("trade");
    expect(ids).not.toContain("arts");
  });

  it("includes root as first element", () => {
    const subtree = buildSubtree(NODES, "economy");
    expect(subtree[0]?.id).toBe("economy");
  });

  it("respects maxDepth cap", () => {
    const subtree = buildSubtree(NODES, "economy", 1);
    const ids = subtree.map((n) => n.id);
    expect(ids).toContain("economy");
    expect(ids).toContain("investments");
    expect(ids).toContain("trade");
    // etf is at depth 2 (root=0, +2 levels) → excluded with maxDepth 1
    expect(ids).not.toContain("etf");
  });

  it("returns empty array for unknown rootId", () => {
    expect(buildSubtree(NODES, "unknown")).toEqual([]);
  });

  it("works for a leaf node (no children)", () => {
    const subtree = buildSubtree(NODES, "etf");
    expect(subtree).toHaveLength(1);
    expect(subtree[0]?.id).toBe("etf");
  });

  it("sorts children by label within each level", () => {
    const subtree = buildSubtree(NODES, "economy");
    const childIds = subtree.filter((n) => n.parentId === "economy").map((n) => n.id);
    // "Investments" < "Trade" alphabetically
    expect(childIds).toEqual(["investments", "trade"]);
  });

  it("caps at depth 4 by default — deeper nodes are excluded", () => {
    const deep: TreeNode[] = [
      node("a", "A", 0),
      node("b", "B", 1, "a"),
      node("c", "C", 2, "b"),
      node("d", "D", 3, "c"),
      node("e", "E", 4, "d"),
      node("f", "F", 5, "e"), // 5 levels below root → excluded
    ];
    const ids = buildSubtree(deep, "a").map((n) => n.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toContain("c");
    expect(ids).toContain("d");
    expect(ids).toContain("e");
    expect(ids).not.toContain("f");
  });
});

// ─── buildSearchResults ───────────────────────────────────────────────────────

describe("buildSearchResults", () => {
  it("returns matching node and its subtree", () => {
    const results = buildSearchResults(NODES, "econom");
    const ids = results.map((n) => n.id);
    expect(ids).toContain("economy");
    expect(ids).toContain("investments");
    expect(ids).toContain("etf");
    expect(ids).toContain("trade");
    expect(ids).not.toContain("arts");
  });

  it("is accent-insensitive (économie matches Economy)", () => {
    const results = buildSearchResults(NODES, "économ");
    expect(results.map((n) => n.id)).toContain("economy");
  });

  it("deduplicates nodes that appear in multiple match subtrees", () => {
    // "investments" label also contains no duplicate, but "etf" child of
    // "investments" should appear only once even if economy + investments both match.
    const results = buildSearchResults(NODES, "invest");
    const ids = results.map((n) => n.id);
    // "etf" should appear exactly once
    expect(ids.filter((id) => id === "etf")).toHaveLength(1);
  });

  it("returns empty array for empty query", () => {
    expect(buildSearchResults(NODES, "")).toEqual([]);
    expect(buildSearchResults(NODES, "   ")).toEqual([]);
  });

  it("returns empty array when no node matches", () => {
    expect(buildSearchResults(NODES, "sports")).toEqual([]);
  });

  it("respects maxDepth when building subtrees", () => {
    const results = buildSearchResults(NODES, "econom", 1);
    const ids = results.map((n) => n.id);
    expect(ids).toContain("economy");
    expect(ids).toContain("investments");
    expect(ids).toContain("trade");
    expect(ids).not.toContain("etf");
  });
});
