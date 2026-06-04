import { resolveToggleBookmark } from "../convex/bookmarks/model";

describe("resolveToggleBookmark", () => {
  it("inserts when no bookmark exists yet", () => {
    expect(resolveToggleBookmark(null)).toBe("insert");
  });

  it("deletes when the content is already bookmarked", () => {
    expect(resolveToggleBookmark({ _id: "bookmark_1" })).toBe("delete");
  });
});
