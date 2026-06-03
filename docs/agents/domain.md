# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root
- `docs/adr/` for architectural decisions relevant to the current topic
- `docs/convex-components-descriptions.md` before proposing, prototyping, or implementing a Convex-backed feature
- `docs/research/2026-06-03-reference-repositories.md` when mobile implementation details, auth wiring, i18n structure, or responsive patterns are unclear

If any of these files don't exist yet, proceed silently.

## File structure

This repo is configured as a single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When naming domain concepts, use the terms defined in `CONTEXT.md`.

## Prefer existing Convex components

When a feature touches auth, storage, video, payments, notifications, workflows, rate limiting, search, or other backend capabilities, review `docs/convex-components-descriptions.md` first. Prefer an existing Convex component when it covers the need cleanly; justify custom implementation when it does not.

## Reuse proven mobile patterns

For Expo/React Native decisions, prefer proven patterns from the documented reference repos, especially for Clerk + Convex auth wiring, env validation, translation structure, and iPhone/iPad responsiveness.

When multiple reference repos exist, prefer the most production-proven mobile repo first, then use secondary repos only to complement missing patterns.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, surface it explicitly instead of silently overriding it.
