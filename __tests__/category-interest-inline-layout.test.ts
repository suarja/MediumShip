import type { Id } from "../convex/_generated/dataModel";
import {
  buildInitialRevealedAnchors,
  buildInlineCloudEntries,
} from "../src/features/categories/category-interest-inline-layout";
import { buildCategoryPickerTree } from "../src/features/categories/category-interest-tree";

describe("category interest inline layout", () => {
  const literatureId = "literature" as Id<"categories">;
  const romanId = "roman" as Id<"categories">;
  const poetryId = "poetry" as Id<"categories">;
  const essayId = "essay" as Id<"categories">;
  const cultureId = "culture" as Id<"categories">;
  const sportId = "sport" as Id<"categories">;
  const footballId = "football" as Id<"categories">;
  const beachId = "beach" as Id<"categories">;

  it("weaves children left and right of the expanded parent in place", () => {
    const { roots, childrenByParent } = buildCategoryPickerTree([
      { _id: cultureId, label: "Culture", iconKey: "culture", depth: 1 },
      { _id: literatureId, label: "Littérature", iconKey: "culture", depth: 1 },
      {
        _id: romanId,
        label: "Roman",
        iconKey: "culture",
        parentId: literatureId,
        depth: 2,
      },
      {
        _id: poetryId,
        label: "Poésie",
        iconKey: "culture",
        parentId: literatureId,
        depth: 2,
      },
    ]);

    const revealed = new Set([String(literatureId)]);
    const entries = buildInlineCloudEntries(roots, childrenByParent, revealed);

    expect(entries.map(({ node, satellite }) => `${satellite ? "~" : ""}${node.label}`)).toEqual([
      "Culture",
      "~Poésie",
      "Littérature",
      "~Roman",
    ]);
  });

  it("keeps multiple revealed parents visible at the same time", () => {
    const { roots, childrenByParent } = buildCategoryPickerTree([
      { _id: literatureId, label: "Littérature", iconKey: "culture", depth: 1 },
      { _id: romanId, label: "Roman", iconKey: "culture", parentId: literatureId, depth: 2 },
      { _id: sportId, label: "Sport", iconKey: "culture", depth: 1 },
      {
        _id: footballId,
        label: "Football",
        iconKey: "culture",
        parentId: sportId,
        depth: 2,
      },
      {
        _id: beachId,
        label: "Beach soccer",
        iconKey: "culture",
        parentId: sportId,
        depth: 2,
      },
    ]);

    const revealed = new Set([String(literatureId), String(sportId)]);
    const entries = buildInlineCloudEntries(roots, childrenByParent, revealed);

    expect(entries.map(({ node }) => node.label)).toEqual([
      "Littérature",
      "Roman",
      "Beach soccer",
      "Sport",
      "Football",
    ]);
  });

  it("seeds reveals from picked parents on first load", () => {
    const nodes = [
      { _id: sportId, label: "Sport", iconKey: "culture", depth: 1 },
      {
        _id: footballId,
        label: "Football",
        iconKey: "culture",
        parentId: sportId,
        depth: 2,
      },
    ];
    const { childrenByParent } = buildCategoryPickerTree(nodes);

    const revealed = buildInitialRevealedAnchors(nodes, childrenByParent, new Set(["sport"]));

    expect([...revealed]).toEqual([String(sportId)]);
  });

  it("expands a level-2 child inline when it is revealed", () => {
    const { roots, childrenByParent } = buildCategoryPickerTree([
      { _id: literatureId, label: "Littérature", iconKey: "culture", depth: 1 },
      { _id: romanId, label: "Roman", iconKey: "culture", parentId: literatureId, depth: 2 },
      {
        _id: essayId,
        label: "Essai",
        iconKey: "culture",
        parentId: romanId,
        depth: 3,
      },
    ]);

    const revealed = new Set([String(literatureId), String(romanId)]);
    const entries = buildInlineCloudEntries(roots, childrenByParent, revealed);

    expect(entries.map(({ node, satellite }) => `${satellite ? "~" : ""}${node.label}`)).toEqual([
      "Littérature",
      "Roman",
      "~Essai",
    ]);
  });
});
