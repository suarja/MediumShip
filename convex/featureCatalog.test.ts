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
  countNavTabsInBar,
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
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Surfaces")).toBe(false);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Capacités membres")).toBe(
      true,
    );

    const tables = FEATURE_CATALOG_GROUPS.find((group) => group.group === "Tables");
    expect(tables?.features.map((feature) => feature.key).sort()).toEqual(
      [...NAV_TAB_KEYS].sort(),
    );
    expect(tables?.features).toHaveLength(NAV_TAB_KEYS.length);

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
    expect(collections?.nature).toBe("navTab");
    expect(collections?.group).toBe("Tables");
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
      "premiumInsights",
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
    expect(defaults.home.inBar).toBe(true);
    expect(defaults.profile.enabled).toBe(true);
    expect(defaults.profile.inBar).toBe(true);
    // agenda/community/collections: enabled but NOT in bar by default
    expect(defaults.collections.enabled).toBe(true);
    expect(defaults.collections.inBar).toBe(false);
    expect(defaults.agenda.enabled).toBe(true);
    expect(defaults.agenda.inBar).toBe(false);
    expect(defaults.community.enabled).toBe(true);
    expect(defaults.community.inBar).toBe(false);
    // Exactly 5 in the bar by default
    expect(countNavTabsInBar(defaults)).toBe(NAV_TAB_CAP);
  });

  it("builds a default nav order matching the catalog order", () => {
    expect(buildDefaultNavOrder()[0]).toBe("home");
    expect(buildDefaultNavOrder()).toEqual([...NAV_TAB_KEYS]);
  });

  it("resolveEffectiveNavigation returns enabled+inBar nav tabs in navOrder and capped", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true, inBar: true },
      discover: { enabled: true, inBar: true },
      explore: { enabled: true, inBar: true },
      library: { enabled: true, inBar: true },
      profile: { enabled: true, inBar: true },
    });

    const nav = resolveEffectiveNavigation(configs, [
      "library",
      "home",
      "discover",
      "explore",
      "profile",
    ]);

    expect(nav[0]).toBe("library");
    expect(nav).toContain("profile");
    expect(nav.length).toBe(NAV_TAB_CAP);
    expect(nav).not.toContain("articles");
    expect(nav).not.toContain("bookmarks");
    // collections is enabled but inBar:false → not in the bar navigation
    expect(nav).not.toContain("collections");
  });

  it("resolveEffectiveNavigation omits tabs that are enabled but not inBar", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true, inBar: true },
      discover: { enabled: true, inBar: false },
      explore: { enabled: true, inBar: true },
      library: { enabled: true, inBar: true },
      profile: { enabled: true, inBar: true },
    });

    const nav = resolveEffectiveNavigation(configs, buildDefaultNavOrder());
    // discover is enabled but inBar:false → not in bar navigation
    expect(nav).not.toContain("discover");
    expect(nav).toContain("home");
    expect(nav).toContain("profile");
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
    expect(nav[0]).toBe("explore");
    expect(nav).toContain("home");
    expect(nav).toContain("profile");
  });

  it("a nav tab in the bar requires both enabled:true AND inBar:true", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true, inBar: true },
      discover: { enabled: true, inBar: true },
      explore: { enabled: true, inBar: true },
      library: { enabled: true, inBar: true },
      profile: { enabled: true, inBar: true },
      // enabled but not in bar
      collections: { enabled: true, inBar: false },
      // disabled
      agenda: { enabled: false, inBar: false },
    });

    // collections is enabled but not in bar
    expect(configs.collections.enabled).toBe(true);
    expect(configs.collections.inBar).toBe(false);
    // agenda is fully disabled
    expect(configs.agenda.enabled).toBe(false);
    expect(configs.agenda.inBar).toBe(false);
    // Only 5 in the bar
    expect(countNavTabsInBar(configs)).toBe(NAV_TAB_CAP);
  });

  it("clampNavTabsInConfigs enforces the five-table bar ceiling (inBar, not enabled)", () => {
    // Attempt to put 7 tabs in the bar; normalizeFeatureConfigs itself clamps first,
    // then we call clampNavTabsInConfigs directly to verify idempotence.
    // Default nav order: home, discover, explore, agenda, community, collections, library, profile
    // keep = {home(core), profile(core)} → add discover(3), explore(4), agenda(5=cap).
    // So collections and library are the overflow tabs.
    const configs = normalizeFeatureConfigs({
      home: { enabled: true, inBar: true },
      discover: { enabled: true, inBar: true },
      explore: { enabled: true, inBar: true },
      library: { enabled: true, inBar: true },
      profile: { enabled: true, inBar: true },
      collections: { enabled: true, inBar: true },
      agenda: { enabled: true, inBar: true },
    });

    const clamped = clampNavTabsInConfigs(configs, buildDefaultNavOrder());
    // bar count is capped at 5
    expect(countNavTabsInBar(clamped)).toBeLessThanOrEqual(NAV_TAB_CAP);
    // core tabs stay in bar
    expect(clamped.home.enabled).toBe(true);
    expect(clamped.home.inBar).toBe(true);
    expect(clamped.profile.enabled).toBe(true);
    expect(clamped.profile.inBar).toBe(true);
    // agenda is 4th in nav order → it fits in the bar (5th slot after home/profile/discover/explore)
    expect(clamped.agenda.enabled).toBe(true);
    expect(clamped.agenda.inBar).toBe(true);
    // collections and library are beyond the cap by nav order → inBar=false, but enabled stays true
    expect(clamped.collections.enabled).toBe(true);
    expect(clamped.collections.inBar).toBe(false);
    expect(clamped.library.enabled).toBe(true);
    expect(clamped.library.inBar).toBe(false);
  });

  it("normalizeNavOrder deduplicates while preserving caller order", () => {
    expect(normalizeNavOrder(["discover", "home", "home", "profile"])).toEqual([
      "discover",
      "home",
      "profile",
      "explore",
      "agenda",
      "community",
      "collections",
      "library",
    ]);
  });

  it("countNavTabsInBar counts only enabled+inBar navTab features", () => {
    const configs = normalizeFeatureConfigs({
      home: { enabled: true, inBar: true },
      discover: { enabled: true, inBar: true },
      explore: { enabled: true, inBar: true },
      library: { enabled: true, inBar: true },
      profile: { enabled: true, inBar: true },
      // enabled but NOT in bar → should not count
      collections: { enabled: true, inBar: false },
      // content feature → never in bar
      articles: { enabled: true },
    });

    expect(countNavTabsInBar(configs)).toBe(5);
  });

  it("default configs: agenda/community/collections are enabled but inBar:false", () => {
    const defaults = buildDefaultFeatureConfigs();
    for (const key of ["agenda", "community", "collections"] as const) {
      expect(defaults[key].enabled).toBe(true);
      expect(defaults[key].inBar).toBe(false);
    }
  });
});
