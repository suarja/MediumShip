import { RevenueCat } from "convex-revenuecat";

import { components } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

/**
 * App-facing RevenueCat component client. Webhook auth uses `REVENUECAT_WEBHOOK_AUTH`
 * (set via `npx convex env set REVENUECAT_WEBHOOK_AUTH "<secret>"`). Optional
 * `REVENUECAT_API_KEY` (secret key) is only needed for REST `syncSubscriber` backfill.
 */
export const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});
