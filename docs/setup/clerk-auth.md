# Clerk Auth Setup

The authentication slice wires Clerk → Convex. Code is in place; these steps
configure the Clerk and Convex deployments so the flow actually works.

## 1. Clerk dashboard

1. **JWT template** — create a JWT template named exactly `convex`
   (Dashboard → JWT Templates → New → Convex). This is the `applicationID` that
   `convex/auth.config.ts` checks against the token `aud` claim.
2. **OAuth providers** — enable **Google** and **Apple** (Dashboard → SSO
   Connections / Social Connections). Email + password is enabled by default.

## 2. Convex deployment env

`convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN`. It is the issuer URL of
the Clerk instance (the Frontend API, e.g. `https://<slug>.clerk.accounts.dev`),
discoverable in the Clerk dashboard or decoded from the publishable key.

```sh
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
```

> Already set on the current dev deployment
> (`https://settling-alpaca-26.clerk.accounts.dev`).

## 3. Client env

In `.env.local`:

```sh
EXPO_PUBLIC_CONVEX_URL=...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Manual test (vertical slice)

1. Launch the app → entry gate redirects to `/sign-in` when signed out.
2. **Email + password** works in Expo Go — sign in to land on `/home`.
3. **Google / Apple OAuth** uses the system web browser (`expo-web-browser`)
   and needs a **dev build** (not Expo Go) plus the providers enabled in step 1.
4. On `/home`, tap *Open profile* → the profile screen runs an authenticated
   Convex query (`users.getMe`) resolving identity via
   `ctx.auth.getUserIdentity()`, and upserts the user row. Sign out returns to
   `/sign-in`.

## Key files

| File | Role |
|------|------|
| `convex/auth.config.ts` | Declares Clerk as the Convex JWT provider |
| `convex/users/{queries,mutations}.ts` | Server-side identity (`getMe`, upsert) |
| `app/_layout.tsx` | `ClerkProvider` + `ConvexProviderWithClerk` + tokenCache |
| `src/features/auth/use-stable-auth.ts` | Ref-stabilized `useAuth` for Convex |
| `app/index.tsx` | Entry gate (auth vs app) |
| `app/(auth)/sign-in.tsx` | OAuth + email/password sign-in |
| `app/(app)/_layout.tsx` | Guard: redirect to `/sign-in` when signed out |
