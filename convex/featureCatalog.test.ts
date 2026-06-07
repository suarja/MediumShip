/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import {
  FEATURE_CATALOG,
  FEATURE_CATALOG_GROUPS,
  NAV_TAB_CAP,
  NAV_TAB_KEYS,
  buildDefaultFeatureConfigs,
  buildDefaultNavOrder,
  clampNavTabsInConfigs,
  countEnabledNavTabs,
  deriveEnabledModules,
  normalizeFeatureConfigs,
  normalizeNavOrder,
  resolveEffectiveFeatureConfigs,
  resolveEffectiveNavigation,
} from "./featureCatalog";

describe("featureCatalog", () => {
  it("exposes grouped features with nature, core and lockAccess flags", () => {
    expect(FEATURE_CATALOG.length).toBeGreaterThan(0);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Contenu")).toBe(true);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Tables")).toBe(true);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Surfaces")).toBe(true);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Capacités membres")).toBe(
      true,
    );

    const tables = FEATURE_CATALOG_GROUPS.find((group) => group.group === "Tables");
    expect(tables?.features.map((feature) => feature.key).sort()).toEqual(
      [...NAV_TAB_KEYS].sort(),
    );
    expect(tables?.features).toHaveLength(NAV_TAB_CAP);

    const articles = FEATURE_CATALOG.find((feature) => feature.key === "articles");
    const premium = FEATURE_CATALOG.find((feature) => feature.key === "premium");
    const home = FEATURE_CATALOG.find((feature) => feature.key === "home");
    const collections = FEATURE_CATALOG.find((feature) => feature.key === "collections");

    expect(articles?.nature).toBe("content");
    expect(articles?.core).toBe(true);
    expect(premium?.nature).toBe("content");
    expect(premium?.lockAccess).toBe(true);
    expect(premium?.defaultAccess).toBe("premium");
    expect(home?.nature).toBe("navTab");
    expect(home?.core).toBe(true);
    expect(collections?.nature).toBe("capability");
    expect(collections?.group).toBe("Surfaces");
  });

  it("includes home, explore, library and profile as navTab features", () => {
    for (const key of ["home", "explore", "library", "profile"] as const) {
      const feature = FEATURE_CATALOG.find((entry) => entry.key === key);
      expect(feature?.nature).toBe("navTab");
    }

    expect(FEATURE_CATALOG.find((entry) => entry.key === "home")?.core).toBe(true);
    expect(FEATURE_CATALOG.find((entry) => entry.key === "profile")?.core).toBe(true);
  });

  it("keeps core features enabled even when tenant disables them", () => {
    const effective = resolveEffectiveFeatureConfigs({
      featureConfigs: {
        articles: { enabled: false, access: "member" },
        home: { enabled: false, access: "free", iconKey: "news" },
      },
      enabledModules: [],
    });

    expect(effective.articles.enabled).toBe(true);
    expect(effective.articles.access).toBe("member");
    expect(effective.home.enabled).toBe(true);
  });

  it("keeps lockAccess features on their catalog access level", () => {
    const effective = resolveEffectiveFeatureConfigs({
      featureConfigs: {
        premium: { enabled: true, access: "free" },
      },
    });

    expect(effective.premium.access).toBe("premium");
  });

  it("derives enabledModules from effective feature configs", () => {
    const configs = normalizeFeatureConfigs({
      articles: { enabled: true },
      episodes: { enabled: false },
      videos: { enabled: true },
      premium: { enabled: false },
      home: { enabled: true },
      discover: { enabled: true },
      explore: { enabled: true },
      library: { enabled: true },
      profile: { enabled: true },
      collections: { enabled: false },
      agenda: { enabled: false },
      community: { enabled: false },
      bookmarks: { enabled: false },
      progressSync: { enabled: false },
      offline: { enabled: false },
      personalLists: { enabled: false },
      membersRoom: { enabled: false },
    });

    expect(deriveEnabledModules(configs)).toEqual([
      "articles",
      "videos",
      "home",
      "discover",
      "explore",
      "library",
      "profile",
    ]);
  });

  it("migrates legacy enabledModules when featureConfigs are absent", () => {
    const effective = resolveEffectiveFeatureConfigs({
      enabledModules: ["articles", "discover", "bookmarks"],
    });

    expect(effective.articles.enabled).toBe(true);
    expect(effective.episodes.enabled).toBe(false);
    expect(effective.discover.enabled).toBe(true);
    expect(effective.bookmarks.enabled).toBe(true);
  });

  it("builds sane defaults for every catalog feature", () => {
    const defaults = buildDefaultFeatureConfigs();
    expect(Object.keys(defaults).sort()).toEqual(
      FEATURE_CATALOG.map((feature) => feature.key).sort(),
    );
    expect(defaults.articles.enabled).toBe(true);
    expect(defaults.premium.access).toBe("premium");
    expect(defaults.home.enabled).toBe(true);
    expect(defaults.profile.enabled).toBe(true);
    expect(defaults.collections.enabled).toBe(false);
    expect(countEnabledNavTabs(defaults)).toBe(NAV_TAB_CAP);
  });

  it("builds a default nav order with home first", () => {
    expect(buildDefaultNavOrder()[0]).toBe("home");
    expect(buildDefaultNavOrder()).toEqual([...NAV_TAB_KEYS]);
  });

  it("resolveEffectiveNavigation returns enabled nav tabs ordered with home first and capped", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true },
      discover: { enabled: true },
      explore: { enabled: true },
      library: { enabled: true },
      profile: { enabled: true },
    });

    const nav = resolveEffectiveNavigation(configs, [
      "home",
      "library",
      "discover",
      "explore",
      "profile",
    ]);

    expect(nav[0]).toBe("home");
    expect(nav).toContain("profile");
    expect(nav.length).toBe(NAV_TAB_CAP);
    expect(nav).not.toContain("articles");
    expect(nav).not.toContain("bookmarks");
    expect(nav).not.toContain("collections");
  });

  it("resolveEffectiveNavigation omits disabled nav tabs", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true },
      discover: { enabled: false },
      explore: { enabled: true },
      library: { enabled: true },
      profile: { enabled: true },
    });

    const nav = resolveEffectiveNavigation(configs, buildDefaultNavOrder());
    expect(nav).not.toContain("discover");
    expect(nav).toContain("home");
    expect(nav).toContain("profile");
  });

  it("resolveEffectiveNavigation always keeps core nav tabs even if disabled in input", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: false },
      profile: { enabled: false },
      explore: { enabled: true },
    });

    const nav = resolveEffectiveNavigation(configs, ["explore", "profile", "home"]);
    expect(nav[0]).toBe("home");
    expect(nav).toContain("profile");
  });

  it("clampNavTabsInConfigs enforces the five-table ceiling", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true },
      discover: { enabled: true },
      explore: { enabled: true },
      library: { enabled: true },
      profile: { enabled: true },
      collections: { enabled: true },
      agenda: { enabled: true },
    });

    const clamped = clampNavTabsInConfigs(configs, buildDefaultNavOrder());
    expect(countEnabledNavTabs(clamped)).toBeLessThanOrEqual(NAV_TAB_CAP);
    expect(clamped.home.enabled).toBe(true);
    expect(clamped.profile.enabled).toBe(true);
    expect(clamped.collections.enabled).toBe(true);
  });

  it("normalizeNavOrder deduplicates and forces home first", () => {
    expect(normalizeNavOrder(["discover", "home", "home", "profile"])).toEqual([
      "home",
      "discover",
      "profile",
      "explore",
      "library",
    ]);
  });

  it("countEnabledNavTabs counts only enabled navTab features", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true },
      discover: { enabled: true },
      explore: { enabled: true },
      library: { enabled: true },
      profile: { enabled: true },
      collections: { enabled: true },
      articles: { enabled: true },
    });

    expect(countEnabledNavTabs(configs)).toBe(5);
  });
});
