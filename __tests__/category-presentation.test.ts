import {
  getCategoryPresentation,
  normalizeCategoryKey,
} from "../src/features/categories/category-presentation";

describe("category presentation", () => {
  it("normalizes labels into stable lowercase keys", () => {
    expect(normalizeCategoryKey("Analyses")).toBe("analyses");
    expect(normalizeCategoryKey("Debat video")).toBe("debat-video");
    expect(normalizeCategoryKey("The Youth Response")).toBe("the-youth-response");
  });

  it("returns stable icons for known editorial families", () => {
    expect(getCategoryPresentation("Analyses")).toEqual(
      expect.objectContaining({ normalizedKey: "analyses", icon: "✎" }),
    );
    expect(getCategoryPresentation("Podcast")).toEqual(
      expect.objectContaining({ normalizedKey: "podcasts", icon: "▷" }),
    );
    expect(getCategoryPresentation("Videos")).toEqual(
      expect.objectContaining({ normalizedKey: "videos", icon: "▶" }),
    );
  });

  it("falls back to the default glyph for unknown categories", () => {
    expect(getCategoryPresentation("The Youth Response")).toEqual(
      expect.objectContaining({ normalizedKey: "the-youth-response", icon: "◉" }),
    );
  });
});
