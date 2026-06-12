"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "../lib/env";
import { ToastProvider } from "../components/cms/toast";

const convex = new ConvexReactClient(env.convexUrl);

function useStableAuth() {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, sessionClaims } =
    useAuth();
  const isLoadedRef = useRef(isLoaded);
  const isSignedInRef = useRef(isSignedIn);
  const getTokenRef = useRef(getToken);
  const orgIdRef = useRef(orgId);
  const orgRoleRef = useRef(orgRole);
  const sessionClaimsRef = useRef(sessionClaims);
  const forceSkipCacheOnceRef = useRef(false);
  const [refreshTick, setRefreshTick] = useState(0);

  if (isLoaded) {
    isLoadedRef.current = true;
  }

  if (isSignedIn !== undefined) {
    isSignedInRef.current = isSignedIn;
    orgIdRef.current = orgId;
    orgRoleRef.current = orgRole;
    sessionClaimsRef.current = sessionClaims;
  }

  if (getToken) {
    getTokenRef.current = getToken;
  }

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isSignedInRef.current) {
        forceSkipCacheOnceRef.current = true;
        setRefreshTick((current) => current + 1);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const stableGetToken = useCallback(
    async (options?: { template?: string; skipCache?: boolean }) => {
      const fn = getTokenRef.current;
      if (!fn) {
        return null;
      }

      const forceSkip = forceSkipCacheOnceRef.current;
      forceSkipCacheOnceRef.current = false;

      try {
        return await fn({
          ...(options ?? {}),
          skipCache: forceSkip || !!options?.skipCache,
        });
      } catch {
        if (!forceSkip) {
          return null;
        }

        try {
          return await fn(options ?? {});
        } catch {
          return null;
        }
      }
    },
    [refreshTick],
  );

  return {
    isLoaded: isLoadedRef.current,
    isSignedIn: isSignedInRef.current,
    getToken: stableGetToken,
    orgId: orgIdRef.current,
    orgRole: orgRoleRef.current,
    sessionClaims: sessionClaimsRef.current,
  };
}

function ConvexAuthBridge({ children }: PropsWithChildren) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useStableAuth}>
      <ToastProvider>{children}</ToastProvider>
    </ConvexProviderWithClerk>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <ClerkProvider publishableKey={env.clerkPublishableKey}>
      <ConvexAuthBridge>{children}</ConvexAuthBridge>
    </ClerkProvider>
  );
}
