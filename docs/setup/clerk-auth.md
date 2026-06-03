# Clerk Auth Setup

The authentication slice wires Clerk → Convex. Code is in place; these steps
configure the Clerk and Convex deployments so the flow actually works.

## 1. Clerk dashboard

1. **JWT template** — create a JWT template named exactly `convex`
   (Dashboard → JWT Templates → New → Convex). This is the `applicationID` that
   `convex/auth.config.ts` checks against the token `aud` claim.
2. **OAuth providers** — enable **Google** and **Apple** (Dashboard → SSO
   Connections / Social Connections). Email + password is enabled by default.
3. **Webhook** — Dashboard → Webhooks → Add Endpoint:
   - Endpoint URL: `https://striped-fennec-326.convex.site/clerk-webhook`
     (the Convex **site** URL — `.convex.site`, not `.convex.cloud` — followed
     by `/clerk-webhook`; it is `EXPO_PUBLIC_CONVEX_SITE_URL` + `/clerk-webhook`).
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`.
   - Copy the **Signing Secret** (`whsec_…`) and set it on Convex (step 2).

## 2. Convex deployment env

`convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN`. It is the issuer URL of
the Clerk instance (the Frontend API, e.g. `https://<slug>.clerk.accounts.dev`),
discoverable in the Clerk dashboard or decoded from the publishable key.

```sh
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
```

> Already set on the current dev deployment
> (`https://settling-alpaca-26.clerk.accounts.dev`).

Also set the webhook signing secret from step 1.3:

```sh
npx convex env set CLERK_WEBHOOK_SECRET whsec_...
```

Without it, `convex/http.ts` rejects every webhook with `400 Invalid signature`.

## 3. Client env

In `.env.local`:

```sh
EXPO_PUBLIC_CONVEX_URL=...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Manual test (vertical slice)

1. Launch the app → entry gate redirects to `/sign-in` when signed out.
2. **Create an account** → from `/sign-in` tap *Créer un compte* → enter email +
   password → enter the email verification code → land on `/home`. Works in
   Expo Go.
3. **Email + password sign-in** also works in Expo Go.
4. **Google / Apple OAuth** uses the system web browser (`expo-web-browser`)
   and needs a **dev build** (not Expo Go) plus the providers enabled in step 1.
5. On `/home`, tap *Open profile* → the profile screen runs an authenticated
   Convex query (`users.getMe`) resolving identity via
   `ctx.auth.getUserIdentity()`. Sign out returns to `/sign-in`.
6. **Webhook** (once configured) → creating/updating a user in Clerk fires
   `user.created` / `user.updated` to `/clerk-webhook`, which upserts the row;
   the profile screen shows *Stored in Convex: yes*. Even without the webhook,
   `ensureCurrentUser` lazily creates the row on first authenticated load.

## Key files

| File | Role |
|------|------|
| `convex/auth.config.ts` | Declares Clerk as the Convex JWT provider |
| `convex/users/queries.ts` | `getMe` — server-side identity read |
| `convex/users/mutations.ts` | `ensureCurrentUser`, `upsertFromClerk`, `softDeleteFromClerk` |
| `convex/http.ts` + `convex/httpHandlers/` | `/clerk-webhook` route + Svix verify |
| `app/_layout.tsx` | `ClerkProvider` + `ConvexProviderWithClerk` + tokenCache |
| `src/features/auth/use-stable-auth.ts` | Ref-stabilized `useAuth` for Convex |
| `app/index.tsx` | Entry gate (auth vs app) |
| `app/(auth)/sign-in.tsx` | OAuth + email/password sign-in |
| `app/(auth)/sign-up.tsx` | Email/password account creation + email code |
| `app/(app)/_layout.tsx` | Guard: redirect to `/sign-in` when signed out |
