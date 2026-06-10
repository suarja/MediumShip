/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import { buildDefaultNavOrder } from "../featureCatalog";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN.tokenIdentifier,
      clerkId: ADMIN.subject,
      email: "admin@test.com",
      cmsRole: "admin",
    });
  });
}

describe("cms/mutations — updateModuleSettings", () => {
  it("persists feature configs, icons, and feed sections with visibility", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    await asAdmin.mutation(api.cms.mutations.updateModuleSettings, {
      featureConfigs: {
        articles: { enabled: true, access: "free", iconKey: "analyses" },
        episodes: { enabled: false, access: "member", iconKey: "podcasts" },
        videos: { enabled: true, access: "premium", iconKey: "videos" },
        premium: { enabled: true, access: "free" },
        discover: { enabled: true, access: "free", iconKey: "news" },
        collections: { enabled: false },
        agenda: { enabled: false },
        community: { enabled: false },
        bookmarks: { enabled: false },
        progressSync: { enabled: false },
        offline: { enabled: false },
        personalLists: { enabled: false },
        membersRoom: { enabled: false },
      },
      feedSections: [
        { kind: "video", title: "À regarder", visible: true },
        { kind: "article", title: "Dernières analyses", visible: false },
      ],
    });

    const tenant = await asAdmin.query(api.cms.queries.getTenantSettings, {});
    expect(tenant.enabledModules).toEqual([
      "articles",
      "videos",
      "premium",
      "home",
      "discover",
      "explore",
      "library",
      "profile",
      "premiumInsights",
    ]);
    // articles is a content feature → inBar is always false
    expect(tenant.featureConfigs?.articles).toEqual({
      enabled: true,
      inBar: false,
      access: "free",
      iconKey: "analyses",
    });
    expect(tenant.featureConfigs?.premium?.access).toBe("premium");
    expect(tenant.featureConfigs?.episodes?.enabled).toBe(false);
    expect(tenant.feedSections).toEqual([
      { kind: "video", title: "À regarder", visible: true },
      { kind: "article", title: "Dernières analyses", visible: false },
    ]);
  });

  it("persists nav order and clamps to five inBar tabs when more are requested", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    const customOrder = ["home", "library", "discover", "explore", "profile"];

    await asAdmin.mutation(api.cms.mutations.updateModuleSettings, {
      featureConfigs: {
        home: { enabled: true, inBar: true },
        discover: { enabled: true, inBar: true },
        explore: { enabled: true, inBar: true },
        library: { enabled: true, inBar: true },
        profile: { enabled: true, inBar: true },
        collections: { enabled: false, inBar: false },
      },
      feedSections: defaultTenant.feedSections ?? [],
      navOrder: customOrder,
    });

    const tenant = await asAdmin.query(api.cms.queries.getTenantSettings, {});
    // navOrder is normalized (missing nav tabs appended); the custom prefix is preserved.
    expect(tenant.navOrder?.slice(0, customOrder.length)).toEqual(customOrder);

    // Now try to put 7 tabs inBar — the cap should clamp to 5 inBar
    await asAdmin.mutation(api.cms.mutations.updateModuleSettings, {
      featureConfigs: {
        home: { enabled: true, inBar: true },
        discover: { enabled: true, inBar: true },
        explore: { enabled: true, inBar: true },
        library: { enabled: true, inBar: true },
        profile: { enabled: true, inBar: true },
        collections: { enabled: true, inBar: true },
        agenda: { enabled: true, inBar: true },
      },
      feedSections: defaultTenant.feedSections ?? [],
      navOrder: buildDefaultNavOrder(),
    });

    const clamped = await asAdmin.query(api.cms.queries.getTenantSettings, {});
    expect(clamped.featureConfigs?.home?.enabled).toBe(true);
    expect(clamped.featureConfigs?.home?.inBar).toBe(true);
    expect(clamped.featureConfigs?.profile?.enabled).toBe(true);
    expect(clamped.featureConfigs?.profile?.inBar).toBe(true);
    // 7 inBar were requested; the cap keeps exactly 5 inBar (core + by nav order).
    // Default nav order: home, discover, explore, agenda, community, collections, library, profile
    // keep = {home(core), profile(core)} → add discover(3), explore(4), agenda(5=cap).
    const inBarNavTabs = (
      [
        "home",
        "discover",
        "explore",
        "agenda",
        "community",
        "collections",
        "library",
        "profile",
      ] as const
    ).filter((key) => clamped.featureConfigs?.[key]?.inBar);
    expect(inBarNavTabs.length).toBe(5);
    // agenda is 4th non-core in nav order → fits in bar
    expect(clamped.featureConfigs?.agenda?.inBar).toBe(true);
    expect(clamped.featureConfigs?.agenda?.enabled).toBe(true);
    // collections and library are beyond the cap by nav order → inBar clamped to false, but enabled stays true
    expect(clamped.featureConfigs?.collections?.inBar).toBe(false);
    expect(clamped.featureConfigs?.collections?.enabled).toBe(true);
    expect(clamped.featureConfigs?.library?.inBar).toBe(false);
    expect(clamped.featureConfigs?.library?.enabled).toBe(true);
  });

  it("cannot disable a core feature or override locked access", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    await asAdmin.mutation(api.cms.mutations.updateModuleSettings, {
      featureConfigs: {
        articles: { enabled: false, access: "premium" },
        premium: { enabled: true, access: "free" },
      },
      feedSections: defaultTenant.feedSections ?? [],
    });

    const tenant = await asAdmin.query(api.cms.queries.getTenantSettings, {});
    expect(tenant.featureConfigs?.articles?.enabled).toBe(true);
    expect(tenant.featureConfigs?.premium?.access).toBe("premium");
  });
});

describe("cms/mutations — updateTenantSettings", () => {
  it("updates identity and palette without touching module config", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);
    const asAdmin = t.withIdentity(ADMIN);

    await asAdmin.mutation(api.cms.mutations.updateModuleSettings, {
      featureConfigs: {
        discover: { enabled: false },
      },
      feedSections: [{ kind: "article", title: "Stories", visible: true }],
    });

    await asAdmin.mutation(api.cms.mutations.updateTenantSettings, {
      name: "Acme Media",
      brandLogoUrl: "https://example.com/logo.png",
      appIconUrl: "",
      paletteName: "midnight",
    });

    const tenant = await asAdmin.query(api.cms.queries.getTenantSettings, {});
    expect(tenant.name).toBe("Acme Media");
    expect(tenant.themeConfig?.paletteName).toBe("midnight");
    expect(tenant.feedSections?.[0]?.title).toBe("Stories");
  });
});
