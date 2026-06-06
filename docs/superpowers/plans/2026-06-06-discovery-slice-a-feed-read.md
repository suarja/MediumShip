# Discovery Slice A — Discover renders (guest-first, read-only)

> **Letter nomenclature on purpose.** Numbered slices are run in parallel by other agents; the Discovery feature uses letters (A/B/C) to avoid collision. This is the first of three vertical slices — see the spine `2026-06-06-slice-6-discovery-engine.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to run this task-by-task. For every RN/UI task, **also invoke the `frontend-design` skill** (see Read First). Steps use checkbox (`- [ ]`) syntax.

**Goal:** a guest opens the **Discover** tab and scrolls a real, mixed feed (editorial + controlled random), with premium content correctly hidden when the `premium` module is off. No interactions, no personalization yet — but the hexagon ships: the `Provider` port, a first `ScoringPolicy`, and the shared `ContentVisibility` gate are all in place at minimal depth.

**End-to-end proof:** on device (phone + iPad, light + `midnight`), the Discover tab is visible when the module is on and hidden when off; the feed loads for a guest; `reason` labels render; empty + loading states render.

**Tech Stack:** Convex (port, scoring, query), Expo Router, React Native, TypeScript, Jest, Vitest + convex-test.

---

## Read First

- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — **architecture spine**: hexagon, canonical `Content` mapping, `ContentProvider` port spec, `ScoringPolicy` interface, `ContentVisibility`, File Structure.
- `docs/adr/0003-content-discovery-engine.md` — scoring rationale, feed-mix rationale, provider isolation (Risk 6).
- `docs/agents/mockup-to-code-map.md` — token map, `styles.css` spec, shell patterns, i18n + guest-first conventions, traps.
- `docs/agents/ui-visual-testing.md` — Expo-web + headless-Chrome pixel protocol; auth-gated + `midnight` manual.
- `convex/_generated/ai/guidelines.md` — read before touching `convex/`.
- `CLAUDE.md`.
- Existing patterns to mirror: `convex/content/queries.ts` (`listPublishedFeed` read style); `src/features/tenant/public-config.ts` (`isModuleEnabled`, `NAVIGATION_MODULES`, `filterAndOrderFeedContent` premium gate); `app/(app)/explore.tsx` (module-gated screen); `src/components/content/content-card.tsx` (card surface to reuse).

### Front-end fidelity — no literal feed mockup

There is **no dedicated Discover/feed mockup**. Do not invent UI from scratch and do not block on a missing mockup. Instead:

- **Invoke the `frontend-design` skill** for Task 5.
- **Infer the feed UI from the maquette _style_**, not a literal screen: source tokens + card/list patterns from `docs/podapp/project/mobile-mockups/styles.css`, `proto-screens.jsx`, `screens.jsx`, `variations.jsx`, and mirror the existing `src/components/content/content-card.tsx`. The Discover feed is a vertical scroll of those cards with a small `reason` kicker.

Standing rules: never hardcode colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; **test where the code lives** — Convex → Vitest/convex-test, RN/UI → Jest.

---

## Scope Guard

Includes:

- `ContentProvider` **port** + `cmsProvider` adapter + `PROVIDERS` registry (hexagonal seam — one adapter, deliberate).
- `ScoringPolicy` **v0** (pure): `ContentVisibility`, recency ordering, controlled random, `bucketFeed` over `editorial` + `random` only.
- `getDiscoveryFeed` query — **guest path** (no `tokenIdentifier`).
- `"discover"` registered in `NAVIGATION_MODULES` + `defaultTenant.enabledModules` + seed; editorial `Feed` rerouted through the shared `isContentVisible`.
- `app/(app)/discover.tsx` + `use-discovery-feed.ts` (read-only) + `reason` i18n.

Does **not** include (lands in Slice B / C):

- `contentInteractions` / `userPreferences` tables, `recordInteraction`, affinities, personalized + archive buckets.
- skip/like affordances; ambient view/open/finish wiring.
- Any external `Provider` adapter (Slice 7+ numeric roadmap).

---

## File Structure

- `convex/discovery/scoring.ts` — `ScoringPolicy` v0 (pure): `normalizeScoringKey` (defined now, used by B), `bucketFeed(scored, mix, rng)` for `editorial`/`random`, `FeedItem` + `reason` type. No `ctx`.
- `convex/discovery/visibility.ts` — `isContentVisible(content, enabledModules)`.
- `convex/discovery/provider.ts` — `ContentProvider` port + `cmsProvider` + `PROVIDERS`.
- `convex/discovery/feed.ts` — `getDiscoveryFeed` query (guest path).
- `convex/discovery/{scoring,visibility,provider,feed}.test.ts` — Vitest.
- `src/features/tenant/public-config.ts` — add `"discover"`; route premium filter through `isContentVisible`.
- `src/features/tenant/default-tenant.ts` + `convex/tenants/seed.ts` — add `"discover"`.
- `app/(app)/discover.tsx`; `src/features/discovery/use-discovery-feed.ts`; `src/i18n/locales/{en,fr}/discover.ts`.
- `__tests__/discover-screen.test.tsx` — Jest.

> **`convex` ⇆ `src` seam:** all scoring math lives in `convex/discovery/scoring.ts`. Nothing in `convex/` imports from `src/`.

---

### Task 1: ScoringPolicy v0 + ContentVisibility (Vitest-first, **pure**)

**Files:** `convex/discovery/scoring.ts`; `convex/discovery/visibility.ts`; `*.test.ts`.

- [ ] **Step 1 (Vitest, pure):**
  - `normalizeScoringKey("Politique")` === `…("politique")` === `…(" Politique ")`; accents folded (`"Démocratie"` → `"democratie"`).
  - `bucketFeed(scored, { editorial: .5, random: .5 }, seededRng)` over 20 items returns counts within ±2 per bucket and tags each item with its `reason`.
  - `isContentVisible(premium, modulesWithoutPremium)` === `false`; with `premium` on === `true`; non-premium always `true`.
- [ ] **Step 2:** implement per the spine's `ScoringPolicy` interface — but only `normalizeScoringKey`, `bucketFeed` (editorial/random), and `isContentVisible`. `bucketFeed` takes an injectable `rng` (default `Math.random`).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): ScoringPolicy v0 + ContentVisibility`.

---

### Task 2: Provider port + cmsProvider (Vitest-first)

**Files:** `convex/discovery/provider.ts`; `convex/discovery/provider.test.ts`.

- [ ] **Step 1 (Vitest):** `cmsProvider.source === "cms"`; `cmsProvider.sync` is identity over `contents` (no duplication, no mutation of existing rows); `PROVIDERS` contains `cmsProvider`; a fake second adapter pushed into a local registry is picked up by the same iteration (proves the seam, not the count).
- [ ] **Step 2:** implement the spine's `ContentProvider` port + `cmsProvider` + `PROVIDERS = [cmsProvider]`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): ContentProvider port + cmsProvider adapter`.

---

### Task 3: getDiscoveryFeed — guest path (Vitest-first)

**Files:** `convex/discovery/feed.ts`; `convex/discovery/feed.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):**
  - Guest call returns published `contents` mixed by recency + random, each carrying a `reason`.
  - Premium content is excluded when `premium` is off (via `isContentVisible`); included when on.
  - Returns at most `limit` items (default 20).
- [ ] **Step 2:** implement `getDiscoveryFeed({ tenantSlug, tokenIdentifier?, limit? })`: load published `contents`, filter through `isContentVisible`, hand to `bucketFeed` (editorial/random mix). No personalization branch yet.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): getDiscoveryFeed guest path`.

---

### Task 4: `"discover"` module registration + shared ContentVisibility

**Files:** `src/features/tenant/public-config.ts`; `src/features/tenant/default-tenant.ts`; `convex/tenants/seed.ts`.

- [ ] Add `"discover"` to `NAVIGATION_MODULES` + `NavigationModule`; add to `defaultTenant.enabledModules`; add to seed's `enabledModules`; re-run seed.
- [ ] Route the premium filter inside `filterAndOrderFeedContent` through the shared `isContentVisible` (replace the inline `enabledModules.includes("premium") || !content.isPremium`). Keep the existing feed regression test green.
- [ ] `tsc` clean. **Commit** — `feat(tenant): register discover module + share ContentVisibility gate`.

---

### Task 5: Discover screen, read-only (Jest-first + `frontend-design` skill)

**Files:** `app/(app)/discover.tsx`; `src/features/discovery/use-discovery-feed.ts`; `src/i18n/locales/{en,fr}/discover.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke the `frontend-design` skill**; infer the feed UI from the maquette style (see Read First) — vertical scroll of `ContentCard`s with a small `reason` kicker. No literal mockup exists; do not invent, infer from `styles.css` + existing cards.
- [ ] **Step 1 (Jest, TDD):**
  - `"discover"` absent from `enabledModules` → screen renders nothing (or redirects).
  - Feed loads → a `ContentCard` per item.
  - Each card shows its `reason` label ("Sélection éditoriale", "Surprise") via i18n.
  - Loading → skeleton; empty → fallback message.
  - Guest-safe: renders without a `tokenIdentifier`.
- [ ] **Step 2:** implement `use-discovery-feed.ts` (read-only `useQuery` wrapper) + `discover.tsx` (`isModuleEnabled` guard, scrollable list, tokens only). Token from `useAuth()` (guest-safe). Add `reason` strings to `discover.ts`.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): read-only Discover screen with mixed feed`.

---

### Task 6: Verify the slice (standard verification — always)

- [ ] **Convex tests:** `npm run test:convex` → PASS.
- [ ] **RN tests:** `npm test` → PASS (discover screen + feed regression).
- [ ] **TypeScript:** `npx tsc --noEmit` and `npx tsc --noEmit -p convex` → PASS.
- [ ] **Hardcoded-color scan:** none in changed mobile files.
- [ ] **Manual smoke** per `docs/agents/ui-visual-testing.md`: Discover tab visible (on) / hidden (off); feed loads on guest; premium hidden when `premium` off; `reason` labels correct; `midnight` palette + iPad layout.
- [ ] `git status --short` clean.

---

## Self-Review

- Vertical: a guest can open Discover and scroll a real feed — end-to-end, not infrastructure-only.
- Hexagon ships at minimal depth: port + `cmsProvider` present; `ScoringPolicy` grows in Slice B; no premature affinity code.
- One `ContentVisibility` gate already shared by the editorial `Feed` and Discover — premium can't leak.
- No `convex → src` import; scoring math is pure and testable without a harness.

## After This Slice

→ **Slice B** (`2026-06-06-discovery-slice-b-signals.md`): interactions, affinities, personalized + archive buckets.
