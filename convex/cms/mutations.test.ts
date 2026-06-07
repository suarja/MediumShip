/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
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
    expect(tenant.enabledModules).toEqual(["articles", "videos", "premium", "discover"]);
    expect(tenant.featureConfigs?.articles).toEqual({
      enabled: true,
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
