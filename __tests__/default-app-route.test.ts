import {
  getDefaultAppRoute,
  shouldRedirectTabBoot,
} from "../src/features/navigation/default-app-route";

describe("getDefaultAppRoute", () => {
  it("returns the first effective tab route", () => {
    expect(getDefaultAppRoute(["library", "home", "profile"])).toBe("/library");
  });

  it("falls back to home when navigation is empty", () => {
    expect(getDefaultAppRoute([])).toBe("/home");
  });

  it("requests a boot redirect when a tab route is loaded but not the configured first tab", () => {
    expect(
      shouldRedirectTabBoot({
        pathname: "/home",
        effectiveNavigation: ["explore", "home", "profile"],
        allTabRouteNames: [
          "home",
          "discover",
          "explore",
          "agenda",
          "community",
          "collections",
          "library",
          "profile",
        ],
      }),
    ).toBe(true);
  });

  it("does not redirect boot when already on the configured first tab", () => {
    expect(
      shouldRedirectTabBoot({
        pathname: "/explore",
        effectiveNavigation: ["explore", "home", "profile"],
        allTabRouteNames: [
          "home",
          "discover",
          "explore",
          "agenda",
          "community",
          "collections",
          "library",
          "profile",
        ],
      }),
    ).toBe(false);
  });
});
