export type NetworkState =
  | "online"
  | "offline"
  | "backendDegraded"
  | "authDegraded";

/**
 * First-pass network awareness. The architecture calls for explicit
 * online/offline/backendDegraded/authDegraded states; this stub always reports
 * `online` so the banner plumbing exists end-to-end before real connectivity
 * and Convex/Clerk health signals are wired in a later milestone.
 */
export function useNetworkStatus(): { state: NetworkState } {
  return { state: "online" };
}
