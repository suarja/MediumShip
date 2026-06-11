import { useEffect } from "react";

import { useClerkAuth } from "../auth/use-clerk-auth";
import { PAYMENTS_ENABLED } from "../tenant/feature-access";
import { configurePurchases } from "./purchases";

/**
 * Keeps RevenueCat `app_user_id` aligned with Clerk on native builds.
 *
 * Gated on `PAYMENTS_ENABLED`: while in-app payments are off, the SDK is never
 * configured. This guarantees a Test Store (`test_…`) key can never reach
 * `Purchases.configure()` in a release build, which RevenueCat explicitly
 * forbids for App Store / Play submissions.
 */
export function PurchasesBootstrap() {
  const { isSignedIn, userId } = useClerkAuth();

  useEffect(() => {
    if (!PAYMENTS_ENABLED || !isSignedIn || !userId) {
      return;
    }
    void configurePurchases(userId);
  }, [isSignedIn, userId]);

  return null;
}
