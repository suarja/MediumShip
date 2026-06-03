import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";

/**
 * Convenience auth state for screens. Route guards react to `isSignedIn`, so
 * `signOut` does not navigate itself — flipping the flag is enough.
 */
export function useClerkAuth() {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();

  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null
    : null;

  return {
    isLoaded: authLoaded && userLoaded,
    isSignedIn: isSignedIn ?? false,
    userId,
    user,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
    fullName,
    signOut,
  };
}
