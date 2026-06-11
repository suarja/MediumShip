import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { PaywallSheet } from "../../components/paywall/paywall-sheet";
import { PurchaseCelebrationModal } from "../../components/paywall/purchase-celebration-modal";
import { logBilling } from "../billing/billing-debug";
import { getPurchasesDiagnostics } from "../billing/purchases";
import { useClerkAuth } from "../auth/use-clerk-auth";
import type { PaywallOpenOptions, PaywallReason } from "./paywall-copy";

type PaywallSheetContextValue = {
  openPaywall: (reason: PaywallReason, options?: PaywallOpenOptions) => void;
  closePaywall: () => void;
};

type PaywallSheetState = {
  visible: boolean;
  reason: PaywallReason;
  previewTitle?: string;
  previewEyebrow?: string;
};

const PaywallSheetContext = createContext<PaywallSheetContextValue | null>(null);

export function PaywallSheetProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useClerkAuth();
  const [state, setState] = useState<PaywallSheetState>({
    visible: false,
    reason: "support",
  });
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  const openPaywall = useCallback((reason: PaywallReason, options?: PaywallOpenOptions) => {
    logBilling("paywall.open", {
      reason,
      isSignedIn,
      previewTitle: options?.previewTitle ?? null,
      diagnostics: getPurchasesDiagnostics(),
    });
    setState({
      visible: true,
      reason,
      previewTitle: options?.previewTitle,
      previewEyebrow: options?.previewEyebrow,
    });
  }, [isSignedIn]);

  const closePaywall = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handlePurchaseSuccess = useCallback(() => {
    closePaywall();
    setCelebrationVisible(true);
  }, [closePaywall]);

  const value = useMemo(() => ({ openPaywall, closePaywall }), [openPaywall, closePaywall]);

  return (
    <PaywallSheetContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={state.visible}
        reason={state.reason}
        previewTitle={state.previewTitle}
        previewEyebrow={state.previewEyebrow}
        isSignedIn={isSignedIn}
        onDismiss={closePaywall}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
      <PurchaseCelebrationModal
        visible={celebrationVisible}
        onDismiss={() => setCelebrationVisible(false)}
      />
    </PaywallSheetContext.Provider>
  );
}

export function usePaywallSheet(): PaywallSheetContextValue {
  const ctx = useContext(PaywallSheetContext);
  if (!ctx) {
    throw new Error("usePaywallSheet must be used inside PaywallSheetProvider");
  }
  return ctx;
}
