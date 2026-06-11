import {
  createElement,
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNetInfo } from "@react-native-community/netinfo";

export type NetworkState =
  | "online"
  | "offline"
  | "backendDegraded"
  | "authDegraded";

export type NetworkStateOverride = "auto" | NetworkState;

type NetworkStatusDebugContextValue = {
  override: NetworkStateOverride;
  setOverride: (value: NetworkStateOverride) => void;
};

const NetworkStatusDebugContext = createContext<NetworkStatusDebugContextValue>({
  override: "auto",
  setOverride: () => {},
});

export function NetworkStatusDebugProvider({ children }: PropsWithChildren) {
  const [override, setOverride] = useState<NetworkStateOverride>("auto");

  const value = useMemo(
    () => ({
      override,
      setOverride,
    }),
    [override],
  );

  return createElement(
    NetworkStatusDebugContext.Provider,
    { value },
    children,
  );
}

export function useNetworkStatusDebug() {
  return useContext(NetworkStatusDebugContext);
}

/**
 * First-pass runtime network awareness. We map device-level connectivity to a
 * real `offline` state now; backend/auth degraded states remain reserved until
 * they have explicit upstream health signals.
 */
export function useNetworkStatus(): { state: NetworkState } {
  const { override } = useNetworkStatusDebug();
  const netInfo = useNetInfo();
  // Offline = the device reports no connection (`isConnected === false`). We do
  // NOT key off `isInternetReachable === false`: at boot it is transiently false
  // while NetInfo probes reachability, which flashed the offline "loading" card
  // before the feed skeleton. `isConnected` is null until resolved → treated as
  // online, so the skeleton paints immediately. (No-internet-while-connected is a
  // degraded state, reserved — see below.)
  const isOffline = netInfo.isConnected === false;

  if (override !== "auto") {
    return { state: override };
  }

  return { state: isOffline ? "offline" : "online" };
}
