import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";

import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { requireCmsAdmin } from "../cms/authz";

/**
 * Cloudflare R2 client for hosted-video files and cover images uploaded from
 * the CMS. Pattern follows the official @convex-dev/r2 docs and the proven
 * Editia web setup (`../editia/web/convex/media/r2.ts`):
 *
 * - Singleton at module top-level (the Convex bundler handles the component).
 * - `DataModel` generic on `clientApi` for properly-typed callback ctx.
 *
 * Required env vars (set via `npx convex env set <NAME> <value>`):
 *   - R2_TOKEN
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - R2_ENDPOINT
 *   - R2_BUCKET
 *   - R2_PUBLIC_URL (optional, recommended) — public bucket base so resolved
 *     URLs are permanent and safe to persist in `playbackUrl`/`heroImageUrl`.
 */
export const r2 = new R2(components.r2);

// `process` is not typed in the Convex tsconfig (no node types); mirror the
// helper used in convex/youtube/enrich.ts to read deployment env vars.
function getEnv(name: string) {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];
}

/**
 * Public mutations consumed by the frontend via `@convex-dev/r2/react`'s
 * `useUploadFile()` hook (it expects them at `api.media.r2.{generateUploadUrl,
 * syncMetadata}`).
 *
 * Unlike the ungated Editia version, `checkUpload` is **admin-guarded**: only a
 * CMS admin can mint a signed upload URL. Without this gate anyone could
 * generate one — we do not ship that.
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    await requireCmsAdmin(ctx);
  },
});

/**
 * Resolves an R2 object key (returned by `useUploadFile`) to a URL playable /
 * renderable by the client.
 *
 * - With `R2_PUBLIC_URL` set (public bucket): returns a permanent URL, safe to
 *   persist in `playbackUrl` / `heroImageUrl`. This is the intended prod path
 *   so the mobile player gets a stable, non-expiring source.
 * - Otherwise (private bucket / dev): returns a 7-day signed URL — fine for
 *   immediate use, not for long-term persistence.
 *
 * No auth gate: R2 keys are unguessable and the resolved media is meant to be
 * served to readers.
 */
export const getKeyUrl = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    if (!key.trim()) {
      return null;
    }

    const publicBase = getEnv("R2_PUBLIC_URL")?.trim().replace(/\/$/, "");
    if (publicBase) {
      return `${publicBase}/${key}`;
    }

    return await r2.getUrl(key, { expiresIn: 7 * 24 * 60 * 60 });
  },
});
