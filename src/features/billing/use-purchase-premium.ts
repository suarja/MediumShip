import { useCallback, useEffect, useState } from "react";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

import {
  getPremiumOffering,
  isPurchasesSupported,
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

type UsePurchasePremiumResult = {
  offering: PurchasesOffering | null;
  package: PurchasesPackage | null;
  isLoadingOffering: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  status: PurchasePremiumStatus;
  errorMessage: string | null;
  resetStatus: () => void;
  purchasesSupported: boolean;
};

export function usePurchasePremium(): UsePurchasePremiumResult {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoadingOffering, setIsLoadingOffering] = useState(false);
  const [status, setStatus] = useState<PurchasePremiumStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const purchasesSupported = isPurchasesSupported();

  useEffect(() => {
    if (!purchasesSupported) {
      setOffering(null);
      setSelectedPackage(null);
      return;
    }

    let cancelled = false;
    setIsLoadingOffering(true);

    void getPremiumOffering()
      .then((nextOffering) => {
        if (cancelled) return;
        setOffering(nextOffering);
        setSelectedPackage(selectPremiumPackage(nextOffering));
      })
      .catch(() => {
        if (cancelled) return;
        setOffering(null);
        setSelectedPackage(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOffering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [purchasesSupported]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const purchase = useCallback(async () => {
    if (!selectedPackage) {
      setStatus("error");
      setErrorMessage("Offering unavailable.");
      return;
    }

    setStatus("pending");
    setErrorMessage(null);

    const result = await purchasePremiumPackage(selectedPackage);
    switch (result.kind) {
      case "success":
        setStatus("success");
        break;
      case "already":
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
  }, [selectedPackage]);

  const restore = useCallback(async () => {
    setStatus("pending");
    setErrorMessage(null);

    const result = await restorePurchases();
    switch (result.kind) {
      case "success":
        setStatus("success");
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
  }, []);

  return {
    offering,
    package: selectedPackage,
    isLoadingOffering,
    purchase,
    restore,
    status,
    errorMessage,
    resetStatus,
    purchasesSupported,
  };
}
