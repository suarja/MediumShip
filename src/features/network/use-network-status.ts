import { useNetInfo } from "@react-native-community/netinfo";

export type NetworkState =
  | "online"
  | "offline"
  | "backendDegraded"
  | "authDegraded";

/**
 * First-pass runtime network awareness. We map device-level connectivity to a
 * real `offline` state now; backend/auth degraded states remain reserved until
 * they have explicit upstream health signals.
 */
export function useNetworkStatus(): { state: NetworkState } {
  const netInfo = useNetInfo();
  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  return { state: isOffline ? "offline" : "online" };
}
