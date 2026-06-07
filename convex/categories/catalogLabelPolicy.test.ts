import { describe, expect, it } from "vitest";

import {
  canAddCatalogNodeToTenant,
  countMeaningfulLabelWords,
  isCompactCatalogRootLabel,
} from "./catalogLabelPolicy";

describe("catalogLabelPolicy", () => {
  it("treats short root labels as compact", () => {
    expect(isCompactCatalogRootLabel("Sport")).toBe(true);
    expect(isCompactCatalogRootLabel("Littérature")).toBe(true);
    expect(isCompactCatalogRootLabel("Science Technology")).toBe(true);
  });

  it("rejects broad multi-word IPTC families", () => {
    expect(isCompactCatalogRootLabel("Economy, Business and Finance")).toBe(false);
    expect(isCompactCatalogRootLabel("Arts, Culture and Entertainment")).toBe(false);
    expect(countMeaningfulLabelWords("Arts, Culture and Entertainment")).toBe(3);
  });

  it("ignores prepositions and articles when counting words", () => {
    expect(countMeaningfulLabelWords("Arts de la culture")).toBe(2);
    expect(isCompactCatalogRootLabel("Arts de la culture")).toBe(true);
    expect(isCompactCatalogRootLabel("Arts de la culture et loisirs")).toBe(false);
  });

  it("allows depth > 0 regardless of label length", () => {
    expect(
      canAddCatalogNodeToTenant(1, "Economy, Business and Finance"),
    ).toBe(true);
    expect(canAddCatalogNodeToTenant(0, "Sport")).toBe(true);
    expect(canAddCatalogNodeToTenant(0, "Economy, Business and Finance")).toBe(
      false,
    );
  });
});
