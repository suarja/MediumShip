# Discovery Slice F — Feed adaptatif & continu (Engagement + zéro dead-end)

> **Letter nomenclature** (parallel numeric slices run by other agents). Builds on Slice E. **Depends on D + E** (ingestion, paginated feed, refill). Branch from `feat/discovery-slice-e-infinite-feed` (or `dev` once A–E merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. UI tasks → invoke `frontend-design`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Why this slice (the real problem):** today the feed feels like raw Wikipedia and **dead-ends** at "vous êtes à jour", because (1) the only interaction signals wired are `like`/`hide` — `open`/scroll/`finish` are **not captured**, so the feed **cannot adapt to usage**; and (2) when the infinite loop was killed, the bottom **stopped auto-loading**. A real feed never says "done": it **recycles + injects new content continuously**, and it **adapts** as you consume. This slice delivers both.

**Generic / white-label first:** nothing here is Wikipedia-specific. `Engagement` is normalized **per `ContentKind`** (article/episode/video), and the continuous feed is **provider-agnostic**. Wikipedia is only the demo provider; a tenant with a YouTube-only catalogue gets the same behaviour.

**Loop-safety (non-negotiable):** continuity is **server-driven** (the query keeps serving recycled content); the client **never resets the cursor** (that caused the previous infinite loop — see `__tests__/use-discovery-feed.test.ts`). `loadMore` only fires on real `onEndReached`.

**Out of scope (next slice):** **Immersion** — showing the *full* Wikipedia article body + hyperlinks on tap (today the detail shows the extract). This slice wires the `open` **signal**, not the rich detail content.

**End-to-end proof:** scroll Découvrir indefinitely — it **never dead-ends** (recycles + new content appends); open several articles in one category, pull-to-refresh → that category visibly **rises** in the feed (the engine adapted to what you opened, with zero explicit likes).

---

## Read First

- `docs/adr/0003-content-discovery-engine.md` + `docs/adr/0004-aggregation-engine.md` — the engine, generic + provider-agnostic.
- `docs/superpowers/plans/2026-06-06-discovery-slice-e-infinite-feed.md` — current paginated feed + refill.
- `CONTEXT.md` › **Engagement**, **Affinity**, **ScoringPolicy**, **FetchDemand** (glossary already defines them).
- `convex/discovery/feed.ts` (`buildOrderedDiscoveryFeed`, `paginateOrderedFeed` — to make continuous), `scoring.ts` (`applyInteraction`/`projectAffinities`, `INTERACTION_WEIGHTS` already include `open`/`finish`), `interactions.ts` (`recordInteraction`), `refill.ts` (throttle).
- `src/features/discovery/use-discovery-feed.ts`, `app/(app)/discover.tsx`.
- Detail + playback surfaces to wire: `app/article/[id].tsx` (covers Wikipedia, kind `article`), `app/episode/[id].tsx`, `app/video/[id].tsx`, `src/features/media/persistent-*` (playback progress, the ≥90 % source of truth), `convex/playbackProgress/*`.
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; remove dead code in the same change (never "later").

---

## Scope Guard

Includes:

- **Continuous feed (no dead-end):** `getDiscoveryFeed` keeps serving while any content exists — unseen first, then recycled (seen/lower-priority, reshuffled), wrapping with a fresh sub-seed so `nextCursor` is never null while content exists. Drop the hard "exhausted = stop"; keep a soft "tu as tout vu de récent, on en cherche d'autres" affordance.
- **Eager, loop-safe refill:** trigger refill when the *unseen* pool runs low (not only at the very end); revisit the 5-min throttle (per-session / shorter) so new content actually arrives at a usable cadence. Background only.
- **Engagement signals (the adaptation):** `convex/discovery/engagement.ts` — pure per-`ContentKind` completion rules (when to emit `finish`); wire `open` (detail mount) and `finish` (episode/video ≥ 90 %; article/wiki scrolled-to-end or read-dwell) → `recordInteraction` → `Affinity` via the existing `ScoringPolicy`. Idempotent, guest no-op.
- **Client continuous list:** `FlatList` with position-composite keys (recycled repeats allowed), `loadMore` always works, the "à jour" dead-end removed.

Does **not** include:

- **Immersion** (full article body + hyperlink nav) — separate next slice.
- Onboarding interest selection — separate slice after this.
- Any provider/ingestion change beyond the refill cadence.
- `edges` graph, vector search, FeedSession materialization.

---

## File Structure

- `convex/discovery/engagement.ts` (+ `.test.ts`) — pure per-`ContentKind` completion/normalization.
- `convex/discovery/feed.ts` (+ `.test.ts`) — continuous serving (recycle + wrap), soft end indicator.
- `convex/discovery/refill.ts` — eager trigger + revisited throttle.
- `src/features/discovery/use-discovery-feed.ts` — continuous consumption (composite keys, always-loadable), eager refill.
- `app/(app)/discover.tsx` — remove dead-end footer; subtle "more incoming" affordance.
- `app/article/[id].tsx`, `app/episode/[id].tsx`, `app/video/[id].tsx`, `src/features/media/persistent-*` — wire `open`/`finish`.
- Tests: `convex/discovery/{engagement,feed}.test.ts`, `__tests__/interaction-wiring.test.tsx`, `__tests__/use-discovery-feed.test.ts` (extend), `__tests__/discover-screen.test.tsx` (extend).

---

### Task 1: Continuous feed — never dead-end (Vitest-first)

**Files:** `convex/discovery/feed.ts`; `convex/discovery/feed.test.ts`.

- [ ] **Step 1 (Vitest):**
  - Paginating past the unseen pool keeps returning content (recycled seen/lower-priority), `nextCursor` stays non-null while any visible content exists.
  - When the whole ordered list is consumed, the cursor **wraps** with a fresh sub-seed (new order), still non-null — no `null`/stop while content exists.
  - Returns a soft flag (e.g. `recycling: true`) instead of a hard `isExhausted` stop; only truly empty corpus → empty + a real "no content" state.
  - Deterministic + loop-safe: same `(token, feedSeed, cursor)` → same page; cursor advances monotonically.
- [ ] **Step 2:** implement recycle + wrap in `buildOrderedDiscoveryFeed`/`paginateOrderedFeed`; keep `ContentVisibility`, hidden-exclusion, all sources.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): continuous feed that recycles instead of dead-ending`.

---

### Task 2: Eager, loop-safe refill (Vitest-first)

**Files:** `convex/discovery/refill.ts`; `convex/discovery/refill.test.ts`.

- [ ] **Step 1 (Vitest):** refill is requested when the *unseen* pool is low (before the very end); coalescing per `(tenant, category)` still holds; throttle window shortened/per-session so refilled content arrives usefully (assert the schedule fires within the new window).
- [ ] **Step 2:** implement; keep it background (`ctx.scheduler`), never in the read path.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): eager background refill on low unseen pool`.

---

### Task 3: Engagement domain core (Vitest-first, pure)

**Files:** `convex/discovery/engagement.ts`; `convex/discovery/engagement.test.ts`.

- [ ] **Step 1 (Vitest, pure):** `Record<ContentKind, …>` rules — `finishThreshold` per kind (episode/video: ≥ 0.9 of duration; article/wiki: scrolled-to-end or dwell ≥ est. read time); a pure `engagementSignals(kind, consumption) → InteractionType[]` returning discrete `open`/`finish` (never cumulative). Generic, no provider/Wikipedia knowledge.
- [ ] **Step 2:** implement; reuse existing `INTERACTION_WEIGHTS` (already have `open`/`finish`). No `ctx`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): Engagement per-ContentKind completion rules`.

---

### Task 4: Wire `open` + `finish` signals (Jest-first)

**Files:** `app/article/[id].tsx`, `app/episode/[id].tsx`, `app/video/[id].tsx`; `src/features/media/persistent-*`; `__tests__/interaction-wiring.test.tsx`.

- [ ] **Step 1 (Jest, TDD):** opening any detail (incl. a Wikipedia article) calls `recordInteraction("open")` once on mount; episode/video crossing ≥ 90 % calls `recordInteraction("finish")` once; article/wiki scrolled-to-end (or read-dwell) calls `finish`; all no-op for guests; idempotent (re-open doesn't stack — `projectAffinities` dedups).
- [ ] **Step 2:** implement via `useEffect` on mount + the Engagement rules for `finish`; reuse `playbackProgress` for media completion.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discovery): capture open/finish engagement signals`.

---

### Task 5: Continuous Discover list (Jest-first + `frontend-design`)

**Files:** `src/features/discovery/use-discovery-feed.ts`; `app/(app)/discover.tsx`; `__tests__/use-discovery-feed.test.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke `frontend-design`** for the "more incoming" affordance (replaces the dead-end footer).
- [ ] **Step 1 (Jest, TDD):**
  - `loadMore` keeps yielding pages (no stop) as long as the server returns content; **regression**: still never resets the cursor (extend `use-discovery-feed.test.ts`).
  - Recycled repeats render via **position-composite keys** (no duplicate-key warning, list grows).
  - No "vous êtes à jour" dead-end; instead a subtle "on en cherche d'autres" while refill is pending; honest empty-state only when the corpus is truly empty.
- [ ] **Step 2:** implement composite keys + always-loadable list; eager refill trigger; remove the dead-end footer. Tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): continuous list, no dead-end`.

---

### Task 6: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Live smoke** (dev): scroll Découvrir a long way — **never dead-ends**; open 3–4 articles in one category (no explicit like) → pull-to-refresh → that category **rises** (engine adapted); guest unaffected; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **Adapts to usage:** `open`/`finish` now feed `Affinity` via the existing `ScoringPolicy` — the feed personalizes from consumption, not only explicit likes. (Answers "ce n'est pas personnalisé".)
- **Never dead-ends:** server recycles + wraps; refill injects new content; client list is continuous. (Answers "ça ne refetche pas en bas".)
- **Loop-safe:** continuity is server-driven; the client never resets the cursor (regression test extended). No return of the infinite loop.
- **Generic / white-label:** `Engagement` is per-`ContentKind`, the feed is provider-agnostic; Wikipedia stays the demo provider only.
- Idempotent signals (no score inflation); guest path writes nothing.

## After This Slice

- **Immersion** — full Wikipedia article body + hyperlink JIT navigation on tap (the "real content" gap).
- **Onboarding** — generic, tenant-taxonomy interest selection (cloud + drill-down) to seed cold-start affinities.
