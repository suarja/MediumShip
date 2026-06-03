# Delivery Workflow

This repo should be built through small, testable vertical slices whenever possible.

## Rules

- Prefer end-to-end slices over horizontal infrastructure-only work.
- Make each new brick manually testable as early as possible.
- Temporary UI is acceptable if it unlocks real validation of a new integration.
- Do not stack several invisible layers before exposing a way to exercise them.

## Applied examples

- When wiring Clerk, add a minimal auth-facing screen or route quickly so the integration can be tested in the running app.
- When wiring Convex, begin with a tiny schema plus one query or mutation path that can be exercised immediately.
- When adding a new module, aim for the smallest user-visible path that proves the whole chain works.

## Intent

The goal is not only clean architecture. The goal is steady progress through slices that can be verified in the app, one step at a time.
