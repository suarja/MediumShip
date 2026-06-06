import { describe, expect, it } from "vitest";

import { isContentVisible } from "./visibility";

describe("isContentVisible", () => {
  const premiumContent = { isPremium: true };
  const freeContent = { isPremium: false };
  const modulesWithoutPremium = ["articles", "episodes", "videos"];
  const modulesWithPremium = [...modulesWithoutPremium, "premium"];

  it("hides premium content when the premium module is off", () => {
    expect(isContentVisible(premiumContent, modulesWithoutPremium)).toBe(false);
  });

  it("shows premium content when the premium module is on", () => {
    expect(isContentVisible(premiumContent, modulesWithPremium)).toBe(true);
  });

  it("always shows non-premium content", () => {
    expect(isContentVisible(freeContent, modulesWithoutPremium)).toBe(true);
    expect(isContentVisible(freeContent, modulesWithPremium)).toBe(true);
  });
});
