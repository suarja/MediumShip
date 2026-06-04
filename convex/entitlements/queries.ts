import { query } from "../_generated/server";
import { getMyEntitlementDoc } from "./authz";
import { isProFromEntitlement } from "./model";

// STABLE READ API — the mobile gate (`useIsMember`) and any member-only surface
// read this. It must keep the same shape when RevenueCat/Stripe webhooks start
// writing the `entitlements` table: the consumer only ever sees `isPro`, never
// which provider granted it.
//
// Returns null for guests (no identity) so the live subscription survives auth
// gaps without throwing; signed-in users get `{ isPro }`.
export const getMyEntitlement = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const doc = await getMyEntitlementDoc(ctx);
    return { isPro: isProFromEntitlement(doc) };
  },
});
