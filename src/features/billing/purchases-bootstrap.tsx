import { useEffect } from "react";

import { useClerkAuth } from "../auth/use-clerk-auth";
import { configurePurchases } from "./purchases";

/** Keeps RevenueCat `app_user_id` aligned with Clerk on native builds. */
export function PurchasesBootstrap() {
  const { isSignedIn, userId } = useClerkAuth();

  useEffect(() => {
    if (!isSignedIn || !userId) {
      return;
    }
    void configurePurchases(userId);
  }, [isSignedIn, userId]);

  return null;
}
