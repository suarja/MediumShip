import type { Doc } from "../_generated/dataModel";

export type NormalizedContent = Doc<"contents">;

export type ProviderContext = {
  db: {
    query: (table: "contents") => {
      withIndex: (
        index: "by_tenant_and_status",
        callback: (q: {
          eq: (field: "tenantSlug", value: string) => {
            eq: (field: "status", value: "published") => unknown;
          };
        }) => unknown,
      ) => {
        collect: () => Promise<NormalizedContent[]>;
      };
    };
  };
};

export interface ContentProvider {
  readonly source: string;
  sync(
    ctx: ProviderContext,
    args: { tenantSlug: string },
  ): Promise<NormalizedContent[]>;
}

export const cmsProvider: ContentProvider = {
  source: "cms",
  async sync(ctx, args) {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();
  },
};

export const PROVIDERS: readonly ContentProvider[] = [cmsProvider];
