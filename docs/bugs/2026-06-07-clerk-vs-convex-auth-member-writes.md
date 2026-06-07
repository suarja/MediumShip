# Clerk `isSignedIn` ≠ Convex authenticated (category interests)

**Date:** 2026-06-07  
**Symptom:** Settings → *Centres d'intérêt* — taps updated the UI briefly, but nothing persisted. After reload, `categoryInterests` was empty in Convex. No obvious mutation in the dashboard.  
**Fixed in:** `useCategoryInterests` + `setCategoryInterests` error handling (branch `feat/discovery-slice-k-cms-catalog-picker`).

---

## What went wrong

We gated reads/writes with **`useClerkAuth().isSignedIn`** (Clerk session in the Expo app).

Convex mutations and queries that call **`ctx.auth.getUserIdentity()`** do **not** use Clerk directly. They need a **Convex JWT** issued via Clerk’s `"convex"` template and wired through **`ConvexProviderWithClerk`** (`app/_layout.tsx` + `useStableAuth`).

So the user could be **Clerk-signed-in** while Convex was still **unauthenticated** (token not ready, auth cleared during Clerk session sync, etc.). In that state:

1. The picker called `setCategoryInterests`.
2. The handler saw `identity === null`.
3. It **returned `null` silently** (no row written, no client error).
4. Optimistic UI cleared when the reactive query still returned `[]`.

From the outside it looked like “selection doesn’t stick” and “no query runs”.

---

## Two auth layers in this app

| Layer | Hook / API | Means |
|--------|------------|--------|
| **Clerk (client session)** | `useClerkAuth()` from `@clerk/clerk-expo` | User logged in in the app; drives guest vs member **UI** (e.g. sign-in banner). |
| **Convex (backend identity)** | `useConvexAuth()` from **`convex/react`** | JWT attached to Convex requests; **`ctx.auth.getUserIdentity()`** in `convex/**`. |

They are related (Clerk feeds Convex via `ConvexProviderWithClerk`) but **not the same boolean**.

**Rule:** For any hook that **reads or writes** protected Convex functions, use **`useConvexAuth()`**:

- `isAuthenticated` — skip queries / allow mutations
- `isLoading` — wait before showing member data or calling writes

Use **`useClerkAuth().isSignedIn`** only for **Clerk-only** UX (show sign-in prompt, profile email, etc.).

**Reference implementations in this repo:** `useBookmarks`, `usePersonalLists`, `useDiscoveryFeed`, `useContentEngagement`.

---

## Where `useConvexAuth` comes from

- Package: **`convex/react`** (same as `useQuery` / `useMutation`).
- Provided by **`ConvexProviderWithClerk`** when the Clerk token is fetched with template `"convex"` and validated against `convex/auth.config.ts` (`CLERK_JWT_ISSUER_DOMAIN` on the deployment).

If Convex auth is misconfigured, **all** member writes fail — not just category interests. Check:

```bash
npx convex env get CLERK_JWT_ISSUER_DOMAIN
```

---

## Fix applied

1. **`useCategoryInterests`**
   - Query `getMyCategoryInterests` only when `isAuthenticated`.
   - `applyCategoryInterests(keys)` throws if not authenticated; passes the **full normalized key set** to the mutation.
   - Loading: wait for Convex auth **then** for the interests query.

2. **`setCategoryInterests`**
   - Throws `ConvexError("Unauthorized")` instead of silent no-op.

3. **Category interests picker**
   - Inline cloud layout, session-scoped “revealed” children, optimistic keys.
   - First tap on a parent: reveal children **and** persist selection.

---

## Checklist for new member features

- [ ] Hook uses **`useConvexAuth()`** for Convex reads/writes.
- [ ] Clerk `isSignedIn` only for guest/member **shell** UI.
- [ ] Mutation throws or returns a clear error when `getUserIdentity()` is null — never silent success.
- [ ] Vitest test for auth rejection on the mutation; Jest test for the hook with mocked `useConvexAuth`.
