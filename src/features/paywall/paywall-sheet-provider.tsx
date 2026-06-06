import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { PaywallSheet } from "../../components/paywall/paywall-sheet";
import { useClerkAuth } from "../auth/use-clerk-auth";
import type { PaywallReason } from "./paywall-copy";

type PaywallSheetContextValue = {
  openPaywall: (reason: PaywallReason) => void;
  closePaywall: () => void;
};

const PaywallSheetContext = createContext<PaywallSheetContextValue | null>(null);

export function PaywallSheetProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useClerkAuth();
  const [state, setState] = useState<{ visible: boolean; reason: PaywallReason }>({
    visible: false,
    reason: "support",
  });

  const openPaywall = useCallback((reason: PaywallReason) => {
    setState({ visible: true, reason });
  }, []);

  const closePaywall = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(() => ({ openPaywall, closePaywall }), [openPaywall, closePaywall]);

  return (
    <PaywallSheetContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={state.visible}
        reason={state.reason}
        isSignedIn={isSignedIn}
        onDismiss={closePaywall}
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
