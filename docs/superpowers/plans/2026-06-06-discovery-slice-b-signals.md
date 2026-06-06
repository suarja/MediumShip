# Discovery Slice B — Discover learns (interactions + personalization)

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Second of three vertical slices — see the spine `2026-06-06-slice-6-discovery-engine.md`. **Depends on Slice A** (`discovery-slice-a-feed-read.md`) being merged: the port, `ScoringPolicy` v0, `ContentVisibility`, the Discover screen, and the `"discover"` module must exist.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. For the RN/UI task, **also invoke the `frontend-design` skill**. Steps use `- [ ]`.

**Goal:** a signed-in `Member` likes/skips cards in Discover; affinities are recorded and the feed re-ranks toward their taste on the next load. The `ScoringPolicy` deepens from v0 to the full weighted model and the full 60/20/10/10 mix.

**End-to-end proof:** sign in, like several cards in one category, reload Discover → that category ranks higher; skip a card → it sinks; affinities persist across sessions. Guests are unchanged (still editorial + random).

**Tech Stack:** Convex (schema, mutation, query), React Native, Jest, Vitest + convex-test.

---

## Read First

- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — **spine**: `ScoringPolicy` full interface (`applyInteraction`, `scoreContent`, full `bucketFeed`), interaction weights, dimension factors, schema for `contentInteractions` + `userPreferences`.
- `docs/superpowers/plans/2026-06-06-discovery-slice-a-feed-read.md` — what already exists.
- `docs/adr/0003-content-discovery-engine.md` — interaction weights, scoring formula, feed-mix rationale, bubble/diversity mitigations.
- `docs/agents/mockup-to-code-map.md` · `docs/agents/ui-visual-testing.md` · `convex/_generated/ai/guidelines.md` · `CLAUDE.md`.
- Existing patterns to mirror: `convex/schema.ts` (`bookmarks`, `playbackProgress` index style); `convex/bookmarks/mutations.ts` + `authz` (identity + guest handling); `src/components/content/content-card.tsx`.

### Front-end fidelity — no literal feed mockup

No dedicated mockup for the skip/like affordances. **Invoke the `frontend-design` skill** for Task 5 and infer the affordance UX from the maquette style (`docs/podapp/project/mobile-mockups/styles.css`, `proto-screens.jsx`, `variations.jsx`) and the existing card. Keep affordances token-driven and reachable on phone + iPad.

Standing rules: no hardcoded colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; test where the code lives.

---

## Scope Guard

Includes:

- `contentInteractions` + `userPreferences` tables + indexes.
- `ScoringPolicy` deepened: `applyInteraction` (weights, dimension factors, `normalizeScoringKey`, clamp), `scoreContent` affinity terms + seen penalty + freshness/archive boosts, full `bucketFeed` (60/20/10/10).
- `recordInteraction` mutation (skip/like) over `applyInteraction`.
- `getDiscoveryFeed` **authenticated path**: load interactions + affinities, drop `hide`-d, full personalized + archive + editorial + random mix.
- Discover screen: skip/like affordances + optimistic removal.

Does **not** include:

- Ambient view/open/finish wiring (Slice C).
- `Entity`/`source` affinity (no tables yet).
- Recommendation explanation beyond the simple `reason` label (Slice C).

---

## File Structure

- `convex/schema.ts` — add `contentInteractions` + `userPreferences` (per spine schema).
- `convex/discovery/scoring.ts` — extend with `applyInteraction` + affinity/penalty/boost terms in `scoreContent` + full `bucketFeed`.
- `convex/discovery/interactions.ts` — `recordInteraction` mutation (thin caller).
- `convex/discovery/feed.ts` — add authenticated branch.
- `convex/discovery/{scoring,interactions,feed}.test.ts` — extend Vitest.
- `app/(app)/discover.tsx` + `src/features/discovery/use-discovery-feed.ts` — add `recordSkip`/`recordLike`.
- `src/components/content/content-card.tsx` — add `onSkip`/`onLike` props.
- `__tests__/discover-screen.test.tsx` — extend Jest.

---

### Task 1: Schema — interactions + preferences

**Files:** `convex/schema.ts`.

- [ ] Add `contentInteractions` (`tokenIdentifier`, `tenantSlug`, `contentId`, `type` ∈ view/open/skip/like/finish/share/hide, `createdAt`; indexes `by_tokenIdentifier_and_contentId`, `by_tokenIdentifier_and_type`, `by_contentId`).
- [ ] Add `userPreferences` (`tokenIdentifier`, `tenantSlug`, `targetType` ∈ category/tag/contentType, `targetId` = **normalized** key, `score`, `updatedAt`; indexes `by_tokenIdentifier_and_target`, `by_tokenIdentifier`).
- [ ] **Commit** — `feat(schema): contentInteractions + userPreferences`.

---

### Task 2: ScoringPolicy deepening (Vitest-first, **pure**)

**Files:** `convex/discovery/scoring.ts`; `convex/discovery/scoring.test.ts`.

- [ ] **Step 1 (Vitest, pure):**
  - `applyInteraction(prefs, { type: "like", category: "Politique", tags: ["Démocratie"], kind: "article" })` raises affinity for `category/politique` + `tag/democratie` (keys via `normalizeScoringKey`); `skip` lowers; `hide` large negative; clamp `[-500, 1000]`. Factors: category 1.0, tag 0.5, contentType 0.2.
  - `scoreContent(content, prefs, now)`: category-matching content outranks unmatched; freshness `+30` (<30 d); archive `+15` (>180 d, unseen); seen penalty `−30` when `open`/`finish` exists.
  - `bucketFeed(scored, { personalized: .6, archive: .2, editorial: .1, random: .1 }, seededRng)` over a seeded 40-item corpus → counts within ±2 per bucket; correct `reason` per item.
- [ ] **Step 2:** extend `scoring.ts` per the spine interface. Keep pure, no `ctx`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): full weighted ScoringPolicy`.

---

### Task 3: recordInteraction (Vitest-first)

**Files:** `convex/discovery/interactions.ts`; `convex/discovery/interactions.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** `recordInteraction` inserts a row; `like`/`skip`/`hide` move affinities as `applyInteraction` dictates; duplicate `view`<60 s is a no-op (debounce); guest (`tokenIdentifier` absent) is silently ignored.
- [ ] **Step 2:** implement — insert the signal, fetch content `category`/`tags`/`kind` + existing affinities, persist `applyInteraction(...)`. No inline weights.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): recordInteraction over ScoringPolicy`.

---

### Task 4: getDiscoveryFeed — authenticated path (Vitest-first)

**Files:** `convex/discovery/feed.ts`; `convex/discovery/feed.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** authenticated call ranks category-matching content above unmatched; `hide`-d content excluded; `open`/`finish`-ed content sinks; full 60/20/10/10 wiring passes the seed through to `bucketFeed`; guest path unchanged.
- [ ] **Step 2:** add the authenticated branch — load `contentInteractions` + `userPreferences`, drop hidden, `scoreContent` per item, full `bucketFeed`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): personalized getDiscoveryFeed`.

---

### Task 5: Skip/like affordances (Jest-first + `frontend-design` skill)

**Files:** `src/components/content/content-card.tsx`; `app/(app)/discover.tsx`; `src/features/discovery/use-discovery-feed.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke the `frontend-design` skill**; infer the skip/like affordance UX from the maquette style + existing card (no literal mockup).
- [ ] **Step 1 (Jest, TDD):** tapping skip → `recordInteraction(type:"skip")` + card removed; tapping like → `recordInteraction(type:"like")`; both no-op for guests (no `tokenIdentifier`).
- [ ] **Step 2:** add `onSkip`/`onLike` to `ContentCard`; `use-discovery-feed.ts` exposes `recordSkip`/`recordLike` (optimistic remove/update via `useMutation`). Tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): skip/like affordances`.

---

### Task 6: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Manual smoke** per `docs/agents/ui-visual-testing.md`: like several cards in one category → reload → that category ranks higher; skip sinks a card; affinities persist across a second session; guest still gets editorial+random; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- Vertical: a member changes their feed by acting on it — observable end-to-end.
- `ScoringPolicy` is the deep module; `recordInteraction` + `feed` stay thin callers; no math leaks into queries.
- `ScoringKey` keeps one identity for affinities; tastes don't fragment.
- `Bookmark` stays autonomous: no `"bookmark"` in the interaction enum.
- Guest path untouched: no affinity writes, no personalization.

## After This Slice

→ **Slice C** (`2026-06-06-discovery-slice-c-ambient.md`, deferrable): ambient view/open/finish signals + richer recommendation explanation.
