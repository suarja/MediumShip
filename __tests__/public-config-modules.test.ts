import {
  isModuleEnabled,
  hasCapability,
  normalizeEnabledModules,
} from "../src/features/tenant/public-config";

describe("isModuleEnabled", () => {
  it("treats nav modules as OFF when absent (strict allowlist, no default-on)", () => {
    const noNavModules = ["articles", "episodes", "videos", "premium"];
    expect(isModuleEnabled(noNavModules, "collections")).toBe(false);
    expect(isModuleEnabled(noNavModules, "agenda")).toBe(false);
    expect(isModuleEnabled(noNavModules, "community")).toBe(false);
  });

  it("returns true for modules present in the array", () => {
    const modules = ["articles", "collections", "agenda"];
    expect(isModuleEnabled(modules, "collections")).toBe(true);
    expect(isModuleEnabled(modules, "agenda")).toBe(true);
  });

  it("returns false for modules absent when explicit nav config exists", () => {
    const modules = ["articles", "collections"];
    expect(isModuleEnabled(modules, "agenda")).toBe(false);
    expect(isModuleEnabled(modules, "community")).toBe(false);
  });

  it("works with a full default-tenant-style modules array", () => {
    const modules = ["articles", "episodes", "videos", "premium", "collections", "agenda", "community"];
    expect(isModuleEnabled(modules, "collections")).toBe(true);
    expect(isModuleEnabled(modules, "agenda")).toBe(true);
    expect(isModuleEnabled(modules, "community")).toBe(true);
  });

  it("returns false for all when the array explicitly omits all nav modules", () => {
    const modules = ["collections"];
    expect(isModuleEnabled(modules, "agenda")).toBe(false);
    expect(isModuleEnabled(modules, "community")).toBe(false);
  });
});

describe("hasCapability", () => {
  it("treats capabilities as OFF when absent (strict allowlist)", () => {
    const modules = ["articles", "episodes"];
    expect(hasCapability(modules, "bookmarks")).toBe(false);
    expect(hasCapability(modules, "progressSync")).toBe(false);
    expect(hasCapability(modules, "offline")).toBe(false);
    expect(hasCapability(modules, "personalLists")).toBe(false);
    expect(hasCapability(modules, "membersRoom")).toBe(false);
  });

  it("returns true for capabilities explicitly in the array", () => {
    const modules = ["articles", "bookmarks", "offline"];
    expect(hasCapability(modules, "bookmarks")).toBe(true);
    expect(hasCapability(modules, "offline")).toBe(true);
  });

  it("returns false for bookmarks when explicit cap config omits it", () => {
    const modules = ["articles", "offline"];
    expect(hasCapability(modules, "bookmarks")).toBe(false);
  });
});

describe("normalizeEnabledModules", () => {
  it("preserves nav modules and capabilities through normalizeEnabledModules", () => {
    const raw = ["articles", "collections", "agenda", "bookmarks", "unknown"];
    const result = normalizeEnabledModules(raw);
    expect(result).toContain("articles");
    expect(result).toContain("collections");
    expect(result).toContain("agenda");
    expect(result).toContain("bookmarks");
    expect(result).not.toContain("unknown");
  });

  it("falls back to content + premium when undefined", () => {
    const result = normalizeEnabledModules(undefined);
    expect(result).toContain("articles");
    expect(result).toContain("premium");
    expect(result).not.toContain("collections");
  });
});
