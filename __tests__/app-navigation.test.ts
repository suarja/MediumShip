import { appendReturnTo } from "../src/features/navigation/app-navigation";

describe("appendReturnTo", () => {
  it("adds returnTo query param to string hrefs", () => {
    expect(appendReturnTo("/favorites", "/profile")).toBe(
      "/favorites?returnTo=%2Fprofile",
    );
  });

  it("preserves existing query params", () => {
    expect(appendReturnTo("/article/abc?foo=bar", "/explore")).toBe(
      "/article/abc?foo=bar&returnTo=%2Fexplore",
    );
  });

  it("leaves href unchanged when returnTo is empty", () => {
    expect(appendReturnTo("/lists", "")).toBe("/lists");
  });
});
