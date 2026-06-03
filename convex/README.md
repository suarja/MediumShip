# Convex Backend

This directory contains the first MediumShip Convex backend surface, organized
by domain instead of keeping every function flat at the root.

## Structure

- `schema.ts` defines the shared data model.
- `content/queries.ts` exposes feed and content-detail queries.
- `tenants/queries.ts` exposes the default demo tenant lookup.
- `tenants/seed.ts` seeds the `demo-media` tenant.
- `_generated/` contains Convex-generated types and runtime helpers.

## Local workflow

Run `npm run convex:dev` to link or start the Convex dev deployment, then run
`npm run convex:seed` after the deployment is available.

## Direction

This layout follows the same domain-oriented Convex structure used in the Be
Viral web app, but kept intentionally small for the MVP bootstrap. As new
backend areas appear, prefer adding folders like `media/`, `youtube/`, and
`entitlements/` instead of returning to a flat root-level function layout.
