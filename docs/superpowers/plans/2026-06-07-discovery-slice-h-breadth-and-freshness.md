# Discovery Slice H — Largeur de découverte + fraîcheur du feed

> **Letter nomenclature** (parallel numeric slices run by other agents). Implements ADR 0005 (steps 1–2) + the "recalcul régulier pendant le scroll" requirement. Builds on D–G. Branch from the branch where Slices D–G landed.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. UI task → invoke `frontend-design`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Why this slice:** today the discoverable universe is a **closed loop bounded by the seed categories** (ADR 0005): we deepen the same themes but never broaden them, and each ingested article's **real categories are thrown away** (`tags: []`, `category` = seed label). And the feed only re-personalizes on pull-to-refresh — so even when new/better content exists, scrolling doesn't surface the adaptation. This slice makes discovery **real and visible**: the corpus broadens, and the feed **adapts as you scroll**.

**Generic / white-label:** all three mechanisms are provider-agnostic. Wikipedia is the demo implementer; a YouTube-only tenant gets the same shapes (its own topic tags + a random-pick quota). The engine just consumes "tags" and a "serendipity" demand slot.

**End-to-end proof:** open several articles in one theme → keep scrolling (no refresh) → that theme **visibly rises** within a few pages; and genuinely **new themes** (from extracted tags + random picks) appear over time — not just more of the seeds.

---

## Read First

- `docs/adr/0005-discovery-breadth.md` — the decision this implements (steps 1–2; frontier-promotion + graph deferred).
- `docs/adr/0004-aggregation-engine.md`, `docs/adr/0003-content-discovery-engine.md`.
- `convex/discovery/providers/wikipedia.ts` (`mediaWikiFetch`, ingestion), `convex/discovery/ingest.ts` (`runDiscoveryIngestion`, `upsertIngested`, `runRefillIngestion`), `convex/discovery/fetchDemand.ts` (`computeFetchDemand`), `convex/discovery/scoring.ts` (`normalizeScoringKey`, tag affinity already supported), `convex/discovery/feed.ts` + `src/features/discovery/use-discovery-feed.ts` (pagination + recycling to simplify).
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; remove dead code in the same change.

---

## Scope Guard

Includes:

- **Tag extraction (ADR 0005 step 1):** on ingestion, capture each page's **real** source categories into `contents.tags` (normalized, maintenance/hidden categories filtered out). `category` stays the fetch label; `tags` carry the real dimensions → finer `Affinity` + a frontier.
- **Serendipity quota (ADR 0005 step 2):** a small bounded slot of each ingestion run fetches **truly random** articles (provider random pick), affinity-independent → novelty enters the corpus.
- **Feed freshness (the "recalcul régulier" requirement):** the feed re-personalizes as the member scrolls — each `loadMore` is scored with **current** affinities, and the client shows each `Content` **at most once per session** (global dedup), so adaptation surfaces without duplicates. Recycling-repeats are dropped (breadth + serendipity make true exhaustion rare; if it ever happens, show a "on cherche du neuf" state + rely on refill).

Does **not** include:

- Frontier promotion (ADR 0005 step 3) and graph/vector exploration (step 4) — later.
- Onboarding interest cloud — the next slice.
- Hyperlink/Immersion v2.

---

## File Structure

- `convex/discovery/providers/wikipedia.ts` — add real-category fetch (`prop=categories`, filter hidden) + a random-article fetch (`list=random`); merge categories into the normalized item's `tags` (+ test).
- `convex/discovery/fetchDemand.ts` / `convex/discovery/ingest.ts` — reserve a bounded **serendipity slot** in the ingestion run (+ test).
- `convex/discovery/feed.ts` — keep fresh per-page scoring; simplify the recycling/wrap path.
- `src/features/discovery/use-discovery-feed.ts` — **global dedup by `_id`**; drop recycling-repeats; keep loop-safe (no cursor reset). Update `__tests__/use-discovery-feed.test.tsx`.

---

### Task 1: Extract real source categories → tags (Vitest-first)

**Files:** `convex/discovery/providers/wikipedia.ts`; `convex/discovery/providers/wikipedia.test.ts`.

- [ ] **Step 1 (Vitest, mocked fetch):** the ingestion request also pulls `prop=categories`; `normalizeWikipediaPage` populates `tags` with the page's real categories, **normalized** via `normalizeScoringKey`, with maintenance/hidden categories filtered (e.g. `Articles_with_*`, `CS1_*`, `Wikipedia_*`, `All_*`, `Use_*`, `Webarchive_*`). Empty when none.
- [ ] **Step 2:** implement; cap the number of tags per item (e.g. ≤ 8) to keep affinity focused.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): capture real Wikipedia categories as content tags`.

---

### Task 2: Serendipity ingestion quota (Vitest-first)

**Files:** `convex/discovery/providers/wikipedia.ts`; `convex/discovery/ingest.ts`; tests.

- [ ] **Step 1 (Vitest, mocked fetch):** `fetchWikipediaRandomPages(n)` uses `list=random&rnnamespace=0` → fetches those pages' extracts/categories; a `runDiscoveryIngestion` run ingests a **bounded** serendipity batch (e.g. `SERENDIPITY_PER_RUN = 4`) in addition to the demand categories; serendipity items carry their **real** category/tags (not a literal "serendipity" label); dedup by `externalId` still holds.
- [ ] **Step 2:** implement; quota is a constant, documented, small.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): bounded serendipity ingestion quota`.

---

### Task 3: Feed freshness — adapts during scroll, no duplicates (Jest-first)

**Files:** `convex/discovery/feed.ts`; `src/features/discovery/use-discovery-feed.ts`; `__tests__/use-discovery-feed.test.tsx`; `__tests__/discover-screen.test.tsx`.

- [ ] **Step 1 (Jest, TDD):**
  - `loadMore` pages reflect **current** affinities (the server already scores fresh per call — assert a category whose affinity rose surfaces in a later page).
  - The client shows each `_id` **at most once** per session (global dedup) — no duplicate cards, even on reactive re-runs (extend the existing regression test).
  - **Loop-safety preserved**: still no cursor reset (keep that regression test green).
  - When the corpus is genuinely exhausted for the session, an honest "on cherche du neuf" state shows (no hard dead-end), and refill/serendipity bring more.
- [ ] **Step 2:** implement global dedup in `use-discovery-feed.ts`; remove the recycling-repeat path (and any now-dead composite-key/`recycling` machinery — delete it in the same change, don't leave it). Simplify `feed.ts` accordingly (keep fresh per-page scoring + hidden-exclusion + `ContentVisibility`).
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): feed adapts during scroll, dedup per session`.

---

### Task 4: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Live smoke** (dev): trigger an ingestion → new items carry real `tags` + some random-topic items appear; open several articles in one theme → scroll (no refresh) → that theme rises within a few pages; no duplicate cards; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **Breadth, not just depth:** real categories captured as tags + a serendipity quota → new themes enter the corpus (ADR 0005 steps 1–2).
- **Adaptation is visible:** fresh per-page scoring + per-session dedup → the feed re-personalizes as you scroll, no duplicates, no refresh needed.
- **Generic / white-label:** tags + serendipity + dedup are provider-agnostic; Wikipedia stays the demo implementer.
- **Loop-safe:** cursor never reset; regression test kept.
- Dead recycling machinery removed in the same change.

## After This Slice

- **Onboarding** — generic tenant-taxonomy interest cloud to seed cold-start affinities (the "vrai flow": amorce → feed déjà ciblé → s'affine à l'usage).
- Frontier promotion (ADR 0005 step 3) + graph/vector exploration (step 4).
