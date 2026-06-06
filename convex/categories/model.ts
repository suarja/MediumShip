import {
  getCategoryIconGlyph,
  isCategoryIconKey,
} from "../../src/features/categories/category-icon-catalog";

export function slugifyCategoryLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertCategoryIconKey(iconKey: string) {
  if (!isCategoryIconKey(iconKey)) {
    throw new Error("Invalid category icon");
  }
}

export function resolveCategoryIconGlyph(iconKey: string) {
  return getCategoryIconGlyph(iconKey);
}
