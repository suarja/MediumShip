import { describe, expect, it } from "vitest";

import { canCreateAnotherList, FREE_MEMBER_LIST_LIMIT } from "./model";

describe("personalLists model", () => {
  it("allows premium members unlimited lists", () => {
    expect(
      canCreateAnotherList(10, { isPro: true, source: "manual" }),
    ).toBe(true);
  });

  it("limits free members to one list", () => {
    expect(canCreateAnotherList(0, null)).toBe(true);
    expect(canCreateAnotherList(FREE_MEMBER_LIST_LIMIT, null)).toBe(false);
    expect(canCreateAnotherList(0, { isPro: false, source: "manual" })).toBe(
      true,
    );
  });
});
