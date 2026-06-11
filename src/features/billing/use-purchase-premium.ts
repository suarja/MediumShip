import { useAction } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

import { api } from "../../../convex/_generated/api";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { logBilling } from "./billing-debug";
import {
  getPurchasesDiagnostics,
  isPurchasesSupported,
  loadPremiumOfferingForUser,
  purchasePremiumPackage,
  restorePurchases,
  selectPremiumPackage,
} from "./purchases";

export type PurchasePremiumStatus =
  | "idle"
  | "pending"
  | "success"
  | "cancelled"
  | "error"
  | "already";

type UsePurchasePremiumOptions = {
  /** When false, skip RevenueCat network calls (e.g. sheet closed). */
  enabled?: boolean;
  onPurchaseSuccess?: () => void;
};

type UsePurchasePremiumResult = {
  offering: PurchasesOffering | null;
  packages: PurchasesPackage[];
  package: PurchasesPackage | null;
  selectPackage: (pkg: PurchasesPackage) => void;
  isLoadingOffering: boolean;
  offeringError: string | null;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  reloadOffering: () => Promise<void>;
  status: PurchasePremiumStatus;
  errorMessage: string | null;
  resetStatus: () => void;
  purchasesSupported: boolean;
};

export function usePurchasePremium(
  options: UsePurchasePremiumOptions = {},
): UsePurchasePremiumResult {
  const { enabled = true, onPurchaseSuccess } = options;
  const { isSignedIn, userId } = useClerkAuth();
  const syncAfterPurchase = useAction(api.entitlements.revenuecatSync.syncAfterPurchase);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoadingOffering, setIsLoadingOffering] = useState(false);
  const [offeringError, setOfferingError] = useState<string | null>(null);
  const [status, setStatus] = useState<PurchasePremiumStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const purchasesSupported = isPurchasesSupported();

  const syncEntitlementToConvex = useCallback(async () => {
    try {
      const result = await syncAfterPurchase({});
      logBilling("hook.convex_sync.done", result);
    } catch (error) {
      logBilling("hook.convex_sync.error", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [syncAfterPurchase]);

  const reloadOffering = useCallback(async () => {
    logBilling("hook.reload_offering", {
      enabled,
      isSignedIn,
      userId,
      purchasesSupported,
      diagnostics: getPurchasesDiagnostics(),
    });

    if (!purchasesSupported || !enabled || !isSignedIn || !userId) {
      setOffering(null);
      setPackages([]);
      setSelectedPackage(null);
      setOfferingError(null);
      return;
    }

    setIsLoadingOffering(true);
    setOfferingError(null);

    try {
      const next = await loadPremiumOfferingForUser(userId);
      setOffering(next.offering);
      const available = next.offering?.availablePackages ?? [];
      setPackages(available);
      const initial = next.package ?? selectPremiumPackage(next.offering);
      setSelectedPackage(initial);
      logBilling("hook.reload_offering.result", {
        offeringId: next.offering?.identifier ?? null,
        packageId: initial?.identifier ?? null,
        packageCount: available.length,
        offeringsSnapshot: next.offeringsSnapshot,
      });
      if (!initial) {
        setOfferingError("Offering unavailable.");
      }
    } catch (error) {
      setOffering(null);
      setPackages([]);
      setSelectedPackage(null);
      const message =
        error instanceof Error ? error.message : "Could not load subscription offer.";
      logBilling("hook.reload_offering.error", { message });
      setOfferingError(message);
    } finally {
      setIsLoadingOffering(false);
    }
  }, [enabled, isSignedIn, purchasesSupported, userId]);

  useEffect(() => {
    void reloadOffering();
  }, [reloadOffering]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const selectPackage = useCallback((pkg: PurchasesPackage) => {
    logBilling("hook.package.select", {
      packageId: pkg.identifier,
      productId: pkg.product.identifier,
      priceString: pkg.product.priceString,
    });
    setSelectedPackage(pkg);
  }, []);

  const purchase = useCallback(async () => {
    logBilling("hook.purchase.tap", {
      hasPackage: Boolean(selectedPackage),
      packageId: selectedPackage?.identifier ?? null,
      offeringId: offering?.identifier ?? null,
    });

    if (!selectedPackage) {
      await reloadOffering();
      setStatus("error");
      setErrorMessage("Offering unavailable. Check RevenueCat configuration.");
      return;
    }

    setStatus("pending");
    setErrorMessage(null);

    const result = await purchasePremiumPackage(selectedPackage);
    logBilling("hook.purchase.result", { kind: result.kind });
    switch (result.kind) {
      case "success":
        await syncEntitlementToConvex();
        setStatus("success");
        onPurchaseSuccess?.();
        break;
      case "already":
        await syncEntitlementToConvex();
        setStatus("already");
        break;
      case "cancelled":
        setStatus("cancelled");
        break;
      case "error":
        setStatus("error");
        setErrorMessage(result.message);
        break;
    }
  }, [
    offering?.identifier,
    onPurchaseSuccess,
    reloadOffering,
    selectedPackage,
    syncEntitlementToConvex,
  ]);

  const restore = useCallback(async () => {
    logBilling("hook.restore.tap", {});
    setStatus("pending");
    setErrorMessage(null);

    const result = await restorePurchases();
    logBilling("hook.restore.result", { kind: result.kind });
    switch (result.kind) {
      case "success":
        await syncEntitlementToConvex();
        setStatus("success");
        onPurchaseSuccess?.();
        break;
      case "none":
        setStatus("error");
        setErrorMessage("No active subscription found.");
        break;
      case "error":
        setStatus("error");
        setErrorMessage(result.message);
        break;
    }
  }, [onPurchaseSuccess, syncEntitlementToConvex]);

  return {
    offering,
    packages,
    package: selectedPackage,
    selectPackage,
    isLoadingOffering,
    offeringError,
    purchase,
    restore,
    reloadOffering,
    status,
    errorMessage,
    resetStatus,
    purchasesSupported,
  };
}
