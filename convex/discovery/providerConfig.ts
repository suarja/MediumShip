import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";

export type TenantWithLegacyWikipediaLocale = {
  providerConfigs?: Record<string, Record<string, unknown>>;
  wikipediaLocale?: "en" | "fr";
};

export function buildWikipediaLocaleMigrationPatch(
  tenant: TenantWithLegacyWikipediaLocale,
):
  | {
      providerConfigs: Record<string, Record<string, unknown>>;
      wikipediaLocale: undefined;
    }
  | null {
  const legacy = tenant.wikipediaLocale;
  if (legacy === undefined) {
    return null;
  }

  const existingConfigs = tenant.providerConfigs ?? {};
  return {
    providerConfigs: {
      ...existingConfigs,
      wikipedia: {
        ...(existingConfigs.wikipedia ?? {}),
        locale: legacy,
      },
    },
    wikipediaLocale: undefined,
  };
}

export const getTenantProviderConfig = internalQuery({
  args: {
    tenantSlug: v.string(),
    source: v.string(),
  },
  returns: v.union(v.record(v.string(), v.any()), v.null()),
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();

    return tenant?.providerConfigs?.[args.source] ?? null;
  },
});

export const setTenantProviderConfig = internalMutation({
  args: {
    tenantSlug: v.string(),
    source: v.string(),
    config: v.union(v.record(v.string(), v.any()), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();

    if (!tenant) {
      throw new Error(`Unknown tenant: ${args.tenantSlug}`);
    }

    const providerConfigs = { ...(tenant.providerConfigs ?? {}) };
    if (args.config === null) {
      delete providerConfigs[args.source];
    } else {
      providerConfigs[args.source] = args.config;
    }

    await ctx.db.patch(tenant._id, { providerConfigs });
    return null;
  },
});

export const migrateWikipediaLocaleToProviderConfig = internalMutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
  }),
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();
    let migrated = 0;

    for (const tenant of tenants) {
      const patch = buildWikipediaLocaleMigrationPatch(
        tenant as TenantWithLegacyWikipediaLocale,
      );
      if (patch === null) {
        continue;
      }

      await ctx.db.patch(tenant._id, patch);
      migrated += 1;
    }

    return { migrated };
  },
});
