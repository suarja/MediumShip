import {
  appendReturnTo,
  buildBackTarget,
  encodeReturnTo,
} from "../src/features/navigation/app-navigation";

describe("appendReturnTo", () => {
  it("adds returnTo as a route param for static hrefs", () => {
    expect(appendReturnTo("/favorites", "/profile")).toEqual({
      pathname: "/favorites",
      params: { returnTo: "/profile" },
    });
  });

  it("maps list detail paths to the dynamic route", () => {
    expect(appendReturnTo("/list/abc", "/lists")).toEqual({
      pathname: "/list/[id]",
      params: { id: "abc", returnTo: "/lists" },
    });
  });

  it("leaves href unchanged when returnTo is empty", () => {
    expect(appendReturnTo("/lists", "")).toBe("/lists");
  });
});

describe("buildBackTarget", () => {
  it("chains a parent returnTo when pushing from an overlay screen", () => {
    expect(buildBackTarget("/lists", "/profile")).toBe("/lists?returnTo=%2Fprofile");
  });
});

describe("encodeReturnTo", () => {
  it("serializes href objects with nested params", () => {
    expect(
      encodeReturnTo({
        pathname: "/lists",
        params: { returnTo: "/profile" },
      }),
    ).toBe("/lists?returnTo=%2Fprofile");
  });
});
