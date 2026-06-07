/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import {
  FEATURE_CATALOG,
  FEATURE_CATALOG_GROUPS,
  buildDefaultFeatureConfigs,
  deriveEnabledModules,
  normalizeFeatureConfigs,
  resolveEffectiveFeatureConfigs,
} from "./featureCatalog";

describe("featureCatalog", () => {
  it("exposes grouped features with core and lockAccess flags", () => {
    expect(FEATURE_CATALOG.length).toBeGreaterThan(0);
    expect(FEATURE_CATALOG_GROUPS.some((group) => group.group === "Contenu")).toBe(true);

    const articles = FEATURE_CATALOG.find((feature) => feature.key === "articles");
    const premium = FEATURE_CATALOG.find((feature) => feature.key === "premium");

    expect(articles?.core).toBe(true);
    expect(premium?.lockAccess).toBe(true);
    expect(premium?.defaultAccess).toBe("premium");
  });

  it("keeps core features enabled even when tenant disables them", () => {
    const effective = resolveEffectiveFeatureConfigs({
      featureConfigs: {
        articles: { enabled: false, access: "member" },
      },
      enabledModules: [],
    });

    expect(effective.articles.enabled).toBe(true);
    expect(effective.articles.access).toBe("member");
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
      discover: { enabled: true },
      collections: { enabled: false },
      agenda: { enabled: false },
      community: { enabled: false },
      bookmarks: { enabled: false },
      progressSync: { enabled: false },
      offline: { enabled: false },
      personalLists: { enabled: false },
      membersRoom: { enabled: false },
    });

    expect(deriveEnabledModules(configs)).toEqual(["articles", "videos", "discover"]);
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
  });
});
