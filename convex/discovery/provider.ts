import type { ActionCtx } from "../_generated/server";
import type { FetchDemand } from "./fetchDemand";

export interface ContentProvider {
  readonly source: string;
  ingest(
    ctx: ActionCtx,
    args: { tenantSlug: string; demand: FetchDemand },
  ): Promise<{ upserted: number }>;
}

export const cmsProvider: ContentProvider = {
  source: "cms",
  async ingest() {
    return { upserted: 0 };
  },
};

export const PROVIDERS: readonly ContentProvider[] = [cmsProvider];
