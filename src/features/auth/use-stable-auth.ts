import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useCallback, useRef } from "react";

// The exact shape ConvexProviderWithClerk's `useAuth` prop expects (a subset of
// Clerk's discriminated UseAuthReturn union).
type ConvexClerkAuth = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  getToken: (options: {
    template?: "convex";
    skipCache?: boolean;
  }) => Promise<string | null>;
  orgId: string | undefined | null;
  orgRole: string | undefined | null;
  sessionClaims: Record<string, unknown> | undefined | null;
};

/**
 * Stabilized wrapper around Clerk's useAuth, wired into ConvexProviderWithClerk.
 *
 * Clerk runs a "native session sync" ~10-15s after login during which
 * `isSignedIn` and `getToken` briefly flip to undefined. ConvexProviderWithClerk
 * reads those transient gaps as "signed out" and calls clearAuth(), wiping all
 * auth-dependent data. We pin the values through refs: once defined they never
 * regress to undefined, while a real sign-out (isSignedIn === false) still
 * propagates. Do not remove this wrapper — the polyfill alone is not enough.
 */
export function useStableAuth(): ConvexClerkAuth {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, sessionClaims } =
    useClerkAuth();

  const getTokenRef = useRef(getToken);
  if (getToken) {
    getTokenRef.current = getToken;
  }
  const stableGetToken = useCallback<ConvexClerkAuth["getToken"]>(
    (options) => getTokenRef.current(options),
    [],
  );

  const isLoadedRef = useRef(isLoaded);
  if (isLoaded) {
    isLoadedRef.current = true;
  }

  const isSignedInRef = useRef(isSignedIn);
  if (typeof isSignedIn === "boolean") {
    isSignedInRef.current = isSignedIn;
  }

  return {
    isLoaded: isLoadedRef.current,
    isSignedIn: isSignedInRef.current,
    getToken: stableGetToken,
    orgId,
    orgRole,
    sessionClaims,
  };
}
