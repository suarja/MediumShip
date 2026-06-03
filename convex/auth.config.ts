// Declares Clerk as the JWT provider for Convex. Without this file,
// ctx.auth.getUserIdentity() always returns null.
//
// CLERK_JWT_ISSUER_DOMAIN must be set on the Convex deployment:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
// It is the issuer URL of the Clerk "convex" JWT template. Convex fetches
// {domain}/.well-known/openid-configuration to discover the JWKS endpoint.
// applicationID is checked against the JWT `aud` claim (the template name).

// `process.env` is provided by the Convex runtime; declared here so the Convex
// tsconfig (no @types/node) typechecks cleanly.
declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
