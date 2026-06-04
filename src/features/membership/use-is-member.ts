import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";

// Canonical hook for gating member ("Pro") capabilities on mobile. Wraps the
// stable `getMyEntitlement` read API — never gate on a payment provider's SDK
// directly, always go through here, so swapping in RevenueCat later changes
// nothing on the client.
//
// Guest-first: an unauthenticated viewer gets `{ isPro: false }` from a null
// result, i.e. a non-member, never an error.
export function useIsMember(): { isMember: boolean; isLoading: boolean } {
  const entitlement = useQuery(api.entitlements.queries.getMyEntitlement, {});

  return {
    isMember: entitlement?.isPro ?? false,
    // `undefined` while the subscription is still resolving; `null` once we know
    // the viewer is a guest. Only the former is genuinely "loading".
    isLoading: entitlement === undefined,
  };
}
