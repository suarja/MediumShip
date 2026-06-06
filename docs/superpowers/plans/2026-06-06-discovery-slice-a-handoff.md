# Handoff — Discovery Slice A (feed read) ✅

**Branch:** `feat/discovery-slice-a-feed-read`  
**Status:** Complete — ready for Slice B.

## What shipped

Guest-first Discover tab: mixed editorial + random feed, premium gate, hexagon at minimal depth (port, ScoringPolicy v0, ContentVisibility).

| Area | Files |
|------|--------|
| Convex domain | `convex/discovery/{scoring,visibility,provider,feed}.ts` + Vitest |
| Tenant module | `"discover"` in `NAVIGATION_MODULES`, seed, `isContentVisible` shared with editorial feed |
| Mobile | `app/(app)/discover.tsx`, `use-discovery-feed.ts`, tab bar + layout gating |
| UX polish | Sections « À la une » / « À redécouvrir » (not per-card algorithm labels) |

## CMS note

Enable **Découverte** in tenant settings (`enabledModules`) — module is strict allowlist, not default-visible until seeded/enabled.

## Verification run

- `npm run test:convex` — PASS
- `npm test` — PASS
- `npx tsc --noEmit` + `npx tsc --noEmit -p convex` — PASS
- Manual smoke needs `npx convex dev` + seed (Expo web alone shows empty/skeleton)

## Explicitly out of scope (Slice B / C)

- `contentInteractions` / `userPreferences` tables
- `recordInteraction`, affinities, personalized + archive buckets
- Skip/like affordances, ambient view/open/finish wiring
- External providers (Wikipedia, etc.)

## Next agent

**Plan:** `docs/superpowers/plans/2026-06-06-discovery-slice-b-signals.md`  
**Spine:** `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md`  
**ADR:** `docs/adr/0003-content-discovery-engine.md`

Suggested skills: `superpowers:subagent-driven-development`, `superpowers:test-driven-development`, read `convex/_generated/ai/guidelines.md` before Convex work.
