# Discovery Slice E — Feed infini (pagination locale + refill on-demand en arrière-plan)

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Builds on Slice D (Wikipedia ingestion). **Depends on D** (`discovery-slice-d-wikipedia-provider.md`). Branch from the latest discovery branch (or `dev` once A–D are merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. For UI tasks, **invoke the `frontend-design` skill**. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Goal:** turn Découvrir into a **flat, continuous infinite feed**. The client paginates the **local corpus** (stable per-session ordering); when the local unseen pool runs low, a **background** refill schedules a Wikipedia fetch (never blocking the scroll), coalesced so concurrent users don't stampede the API. The scheduled `FetchDemand` cron is kept and made deeper.

**End-to-end proof:** scroll Découvrir → pages load continuously; near the end of the local unseen pool, new content appears shortly after (background refill) without any scroll-time spinner waiting on Wikipedia; two devices scrolling at once trigger at most one fetch per (tenant, category); when truly exhausted, the feed shows a graceful "à jour" state + recycled archive rather than a hard stop.

**Tech Stack:** Convex (paginated query, scheduler/action, throttle), Expo Router, React Native (FlatList), Jest, Vitest + convex-test.

---

## Read First

- `docs/adr/0004-aggregation-engine.md` — FetchDemand, **on-demand refill is now in scope** (was deferred; rationale: thin corpus + the A→B "coupling" is a non-issue — shared corpus is desired; the real guards are *background fetch* + *coalescing*).
- `docs/superpowers/plans/2026-06-06-discovery-slice-d-wikipedia-provider.md` — ingestion, `WikipediaProvider`, cron, `by_tenant_source_external` dedup, `isEditorialContent` source isolation.
- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — spine.
- `convex/_generated/ai/guidelines.md` — read before `convex/` (queries are read-only — they cannot schedule; refill is triggered from a mutation/action; `ctx.scheduler.runAfter`).
- Existing code: `convex/discovery/feed.ts` (whole-corpus scored feed — becomes paginated), `convex/discovery/ingest.ts` (`runDiscoveryIngestion`, dedup), `convex/crons.ts`, `app/(app)/discover.tsx` (sectioned list — becomes flat), `src/features/discovery/use-discovery-feed.ts`, `src/features/discovery/group-feed-sections.ts` (to be retired from Discover).

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive via `useResponsive`; modular i18n; test where the code lives.

---

## Scope Guard

Includes:

- **Paginated `getDiscoveryFeed`**: cursor + per-session `feedSeed` → stable ordering across pages; excludes hidden; `ContentVisibility`; all sources; returns `{ items, nextCursor, isExhausted }`.
- **Flat continuous Discover UI** (`FlatList` + `onEndReached`); `reason` becomes a per-card kicker; section grouping retired from Discover.
- **Background on-demand refill**: a `requestDiscoveryRefill` mutation that **schedules** an ingestion (via `ctx.scheduler`) when the local unseen pool is low — **coalesced/throttled** per `(tenant, category)` so concurrent triggers fire at most one fetch; non-blocking.
- **Deeper cron**: larger batch / more demand categories honored per run.
- **End-of-corpus** graceful state: "à jour" + recycled archive (already-seen, lowest priority) so the feed never hard-stops.

Does **not** include:

- Immersion / real detail content (separate slice).
- `Engagement` implicit reading signals (separate ambient slice).
- CMS-configurable Accueil/Découvrir sections + ordering (separate future slice — the editorialised home).
- `edges` graph, vector search, pruning.

---

## File Structure

- `convex/discovery/feed.ts` — paginated, stable-seed ordering; `isExhausted`.
- `convex/discovery/refill.ts` — `requestDiscoveryRefill` mutation + throttle record; schedules `runDiscoveryIngestion` for the demanded categories.
- `convex/schema.ts` — a small throttle table (e.g. `ingestionThrottle`: `tenantSlug`, `categoryKey`, `lastRequestedAt`) for coalescing.
- `convex/crons.ts` / `convex/discovery/ingest.ts` — deepen batch size / categories per run.
- `app/(app)/discover.tsx` — flat `FlatList`, `onEndReached`, end-of-corpus state.
- `src/features/discovery/use-discovery-feed.ts` — paginated consumption (`loadMore`, `isExhausted`), low-watermark → `requestDiscoveryRefill`.
- Retire `group-feed-sections.ts` from Discover (keep for any other caller, else remove — clean up dead code in the same change).
- Tests: `convex/discovery/feed.test.ts`, `convex/discovery/refill.test.ts`, `__tests__/discover-screen.test.tsx`.

---

### Task 1: Paginated, stable-seed feed query (Vitest-first)

**Files:** `convex/discovery/feed.ts`; `convex/discovery/feed.test.ts`.

- [ ] **Step 1 (Vitest):**
  - Same `(tokenIdentifier, feedSeed)` → **stable order**: page 2 continues page 1 with no overlap and no gaps.
  - New `feedSeed` (pull-to-refresh) → reshuffled order.
  - Hidden excluded; `ContentVisibility` applied; all sources included.
  - Returns `{ items, nextCursor, isExhausted }`; `isExhausted` true when no more unseen scored items.
- [ ] **Step 2:** implement cursor pagination over the deterministically-ordered scored set (seed the RNG with `hashFeedSeed(tokenIdentifier, feedSeed)` as today; order, then slice by cursor). Keep `bucketFeed` semantics within the stable order.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): paginated stable-seed discovery feed`.

---

### Task 2: Background on-demand refill, coalesced (Vitest-first)

**Files:** `convex/discovery/refill.ts`; `convex/schema.ts`; `convex/discovery/refill.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):**
  - `requestDiscoveryRefill({ tenantSlug })` schedules an ingestion (assert via `ctx.scheduler` / a scheduled run) for the current `FetchDemand` categories.
  - **Coalescing:** a second call within the throttle window for the same `(tenant, category)` does **not** schedule a duplicate (assert one scheduled run).
  - Guests / signed-out callers are accepted (refill is tenant-level, not per-user-identity-gated) but still throttled.
- [ ] **Step 2:** implement `requestDiscoveryRefill`: compute `FetchDemand`, check/stamp `ingestionThrottle` per `(tenantSlug, categoryKey)`, and `ctx.scheduler.runAfter(0, internal…runDiscoveryIngestion, …)` for non-throttled categories. **Never blocks**; returns immediately. Upsert dedup (`by_tenant_source_external`) already prevents duplicate content.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): coalesced background refill on low corpus`.

---

### Task 3: Flat infinite Discover UI (Jest-first + `frontend-design`)

**Files:** `app/(app)/discover.tsx`; `src/features/discovery/use-discovery-feed.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke `frontend-design`**; flat continuous feed inferred from the maquette style (no sections). `reason` → small per-card kicker.
- [ ] **Step 1 (Jest, TDD):**
  - Renders a flat `FlatList` of feature cards (no section headers).
  - `onEndReached` calls `loadMore`; a second page of cards appears.
  - When the unseen pool is low (below watermark), `requestDiscoveryRefill` is called (mock the mutation).
  - `isExhausted` → renders the "à jour" end state (+ recycled archive), not a blank.
  - Like/Favoris/⋯ controls from Slice C still work on each card.
- [ ] **Step 2:** implement — `use-discovery-feed.ts` exposes `items`, `loadMore`, `isExhausted`, `isLoadingMore`, plus the low-watermark trigger → `requestDiscoveryRefill`; `discover.tsx` becomes a `FlatList` with `onEndReached`, end state, pull-to-refresh (new `feedSeed`). Retire section grouping. Tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): flat infinite feed with background refill`.

---

### Task 4: Deepen the cron (Vitest where pure)

**Files:** `convex/discovery/ingest.ts`; `convex/crons.ts`.

- [ ] Increase per-run batch size and the number of `FetchDemand` categories honored, so the local corpus has depth for pagination. Keep dedup + rate-respect.
- [ ] **Vitest:** the orchestration honors the configured batch/category limits.
- [ ] **Commit** — `feat(discovery): deeper scheduled ingestion batches`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Live smoke** (dev): scroll Découvrir → continuous pages; near the end → new content appears shortly after (no scroll-time wait on Wikipedia); two sessions scrolling → one fetch per (tenant, category) (check `ingestionThrottle` / no duplicate scheduled runs); exhausted → "à jour" + archive; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **A→B is embraced, not feared:** shared corpus is the point; the only real guards — background fetch (no scroll-time latency) + coalescing (no API stampede) + `externalId` dedup — are implementation hygiene, all present.
- **Two depth sources compose:** local pagination over the cron-fed corpus + on-demand refill as the safety net when local runs out.
- **Flat feed for discovery; editorialised sections move to Accueil** (future CMS-configurable slice) — two distinct feed models, not one mixed.
- **No scroll-time blocking:** the read query stays read-only; refill is a scheduled background job; the reactive query surfaces new content.
- Dead code (section grouping on Discover) removed in the same change, not deferred.

## After This Slice

- Editorialised Accueil + CMS configuration of feed sections/ordering (the "deux types de page" the user described).
- Immersion reading mode (real Wikipedia detail content).
- Ambient `Engagement` signals (open / read / finish).
