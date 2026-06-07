import type { Id } from "../../../convex/_generated/dataModel";
import {
  buildCategoryPickerTree,
  buildVisibleCategoryCloud,
  nodeHasChildren,
} from "../src/features/categories/category-interest-tree";

describe("category interest tree", () => {
  const fictionId = "fiction" as Id<"categories">;
  const romanId = "roman" as Id<"categories">;
  const cultureId = "culture" as Id<"categories">;

  it("treats orphan nodes as roots when their parent is missing from the tenant", () => {
    const { roots, childrenByParent } = buildCategoryPickerTree([
      {
        _id: romanId,
        label: "Roman",
        iconKey: "culture",
        parentId: fictionId,
        depth: 2,
      },
      {
        _id: cultureId,
        label: "Culture",
        iconKey: "culture",
        depth: 1,
      },
    ]);

    expect(roots.map((node) => node.label)).toEqual(["Culture", "Roman"]);
    expect(childrenByParent.size).toBe(0);
  });

  it("reveals children in the cloud after focusing a parent", () => {
    const { roots, childrenByParent } = buildCategoryPickerTree([
      {
        _id: fictionId,
        label: "Fiction",
        iconKey: "culture",
        depth: 1,
      },
      {
        _id: romanId,
        label: "Roman",
        iconKey: "culture",
        parentId: fictionId,
        depth: 2,
      },
      {
        _id: cultureId,
        label: "Culture",
        iconKey: "culture",
        depth: 1,
      },
    ]);

    expect(nodeHasChildren(fictionId, childrenByParent)).toBe(true);

    const cloud = buildVisibleCategoryCloud(roots, childrenByParent, [fictionId]);
    expect(cloud.map(({ node }) => node.label)).toEqual(["Culture", "Fiction", "Roman"]);
  });
});
