/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

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
