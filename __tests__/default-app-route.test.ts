import { getDefaultAppRoute } from "../src/features/navigation/default-app-route";

describe("getDefaultAppRoute", () => {
  it("returns the first effective tab route", () => {
    expect(getDefaultAppRoute(["library", "home", "profile"])).toBe("/library");
  });

  it("falls back to home when navigation is empty", () => {
    expect(getDefaultAppRoute([])).toBe("/home");
  });
});
