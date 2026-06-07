/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";
import { buildWikipediaLocaleMigrationPatch } from "./providerConfig";

const TENANT = "demo-media";

describe("discovery/providerConfig — getTenantProviderConfig", () => {
  it("returns the provider blob for a known source", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: {
            locale: "fr",
          },
        },
      });
    });

    const config = await t.query(internal.discovery.providerConfig.getTenantProviderConfig, {
      tenantSlug: TENANT,
      source: "wikipedia",
    });

    expect(config).toEqual({ locale: "fr" });
  });

  it("returns null when the source is not configured", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: {
            locale: "fr",
          },
        },
      });
    });

    const config = await t.query(internal.discovery.providerConfig.getTenantProviderConfig, {
      tenantSlug: TENANT,
      source: "rss",
    });

    expect(config).toBeNull();
  });
});

describe("discovery/providerConfig — setTenantProviderConfig", () => {
  it("writes and removes an opaque provider blob by source", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: { locale: "en" },
        },
      });
    });

    await t.mutation(internal.discovery.providerConfig.setTenantProviderConfig, {
      tenantSlug: TENANT,
      source: "rss",
      config: {
        feeds: ["https://example.com/feed.xml"],
      },
    });

    expect(
      await t.query(internal.discovery.providerConfig.getTenantProviderConfig, {
        tenantSlug: TENANT,
        source: "rss",
      }),
    ).toEqual({
      feeds: ["https://example.com/feed.xml"],
    });

    await t.mutation(internal.discovery.providerConfig.setTenantProviderConfig, {
      tenantSlug: TENANT,
      source: "rss",
      config: null,
    });

    expect(
      await t.query(internal.discovery.providerConfig.getTenantProviderConfig, {
        tenantSlug: TENANT,
        source: "rss",
      }),
    ).toBeNull();
    expect(
      await t.query(internal.discovery.providerConfig.getTenantProviderConfig, {
        tenantSlug: TENANT,
        source: "wikipedia",
      }),
    ).toEqual({ locale: "en" });
  });
});

describe("buildWikipediaLocaleMigrationPatch", () => {
  it("copies legacy wikipediaLocale into providerConfigs and unsets the field", () => {
    expect(
      buildWikipediaLocaleMigrationPatch({
        catalogLocale: "en",
        wikipediaLocale: "fr",
        providerConfigs: {
          rss: { feeds: ["https://example.com/feed.xml"] },
        },
      } as never),
    ).toEqual({
      providerConfigs: {
        rss: { feeds: ["https://example.com/feed.xml"] },
        wikipedia: { locale: "fr" },
      },
      wikipediaLocale: undefined,
    });
  });

  it("returns null when no legacy wikipediaLocale is present", () => {
    expect(
      buildWikipediaLocaleMigrationPatch({
        providerConfigs: {
          wikipedia: { locale: "en" },
        },
      }),
    ).toBeNull();
  });
});

describe("discovery/providerConfig — migrateWikipediaLocaleToProviderConfig", () => {
  it("skips tenants without a legacy wikipediaLocale", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: TENANT,
        name: "Demo",
        enabledModules: ["discover"],
        providerConfigs: {
          wikipedia: { locale: "en" },
        },
      });
    });

    const result = await t.mutation(
      internal.discovery.providerConfig.migrateWikipediaLocaleToProviderConfig,
      {},
    );

    expect(result.migrated).toBe(0);
  });
});
