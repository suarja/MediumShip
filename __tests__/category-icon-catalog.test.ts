import {
  isCategoryIconKey,
  pickCategoryIconKeyForSeed,
} from "../src/features/categories/category-icon-catalog";

describe("pickCategoryIconKeyForSeed", () => {
  it("returns a valid non-default icon key", () => {
    const iconKey = pickCategoryIconKeyForSeed("catalog-node-abc");
    expect(isCategoryIconKey(iconKey)).toBe(true);
    expect(iconKey).not.toBe("default");
  });

  it("is stable for the same seed", () => {
    expect(pickCategoryIconKeyForSeed("medtop:20000346")).toBe(
      pickCategoryIconKeyForSeed("medtop:20000346"),
    );
  });

  it("varies across different seeds", () => {
    const icons = new Set(
      ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e"].map((seed) =>
        pickCategoryIconKeyForSeed(seed),
      ),
    );
    expect(icons.size).toBeGreaterThan(1);
  });
});
